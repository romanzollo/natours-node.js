const Tour = require('../models/tourModel'); // импортируем модель
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // импортируем фабричный контроллер для CRUD операций
const AppError = require('../utils/appError');

// ==================== MIDDLEWARE ====================
// middleware для получения 5 самых дешевых/популярных туров
// ⚠️ В Express 5 req.query нельзя мутировать напрямую,
// поэтому складываем "виртуальные параметры" в req.aliasQuery
const aliasTopTours = (req, res, next) => {
  req.aliasQuery = {
    limit: '5', // лимитируем кол-во документов
    sort: '-ratingsAverage,price', // сортировка по рейтингу и цене
    fields: 'name,price,ratingsAverage,summary,difficulty' // только нужные поля
  };

  next();
};

// ===== Helpers (geo) =====
// Разбирает строку "lat,lng" → { lat: Number, lng: Number }
const parseLatLng = latlng => {
  const [lat, lng] = latlng.split(',');
  return {
    lat: Number(lat),
    lng: Number(lng)
  };
};

// Конвертация расстояния из метров → мили (1м = 0.000621371ми) или км (1м = 0.001км)
const getDistanceMultiplier = unit => (unit === 'mi' ? 0.000621371 : 0.001);
// Конвертация заданного расстояния → метры для $geoNear (1миля = 1609.34м, 1км = 1000м)
const getMaxDistanceInMeters = (distance, unit) =>
  unit === 'mi' ? distance * 1609.34 : distance * 1000;

// ==================== КОНТРОЛЛЕРЫ ====================

// --- получить все туры --- //
// const getAllTours = catchAsync(async (req, res, next) => {
//   // Источник пользовательских фильтров: безопасная копия, если есть, иначе req.query (только чтение)
//   const userQuery = req.safeQuery || req.query;
//   // Публично скрываем секретные, привилегированные роли видят все
//   const baseFilter = req.canSeeSecretTours
//     ? {}
//     : {
//         secretTour: false
//       };

//   // --- ВЫПОЛНЯЕМ ЗАПРОС --- //
//   const features = new APIFeatures(
//     Tour.find(baseFilter),
//     userQuery,
//     req.aliasQuery // сюда подаём "виртуальные" параметры
//   )
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   // валидация страницы теперь тут
//   await features.validatePage(Tour);

//   const tours = await features.query;

//   // --- ОТПРАВЛЯЕМ ОТВЕТ --- //
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: { tours }
//   });
// });
const getAllTours = factory.getAll(Tour); // Получить всех туров
const getTour = factory.getOne(Tour, { path: 'reviews' }); // получить конкретный тур + вложенные документы (populate)
const createTour = factory.createOne(Tour); // создать конкретный тур
const updateTour = factory.updateOne(Tour); // обновить конкретный тур
const deleteTour = factory.deleteOne(Tour); // удалить конкретный тур

// --- получаем статистику по турам (agregation pipeline) --- //
const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // 1) Отбираем только туры с рейтингом >= 4.5
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    // 2) Группируем по сложности тура (difficulty)
    {
      $group: {
        // _id — это ключ группировки. Здесь переводим difficulty в верхний регистр
        _id: { $toUpper: '$difficulty' },
        // считаем количество туров в каждой группе
        numTours: { $sum: 1 },
        // считаем общее количество рейтингов
        numRatings: { $sum: '$ratingsQuantity' },
        // средний рейтинг туров
        avgRating: { $avg: '$ratingsAverage' },
        // средняя цена
        avgPrice: { $avg: '$price' },
        // минимальная цена
        minPrice: { $min: '$price' },
        // максимальная цена
        maxPrice: { $max: '$price' }
      }
    },
    // 3) Сортируем группы по средней цене (возрастание)
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  // Отправляем успешный ответ с полученной статистикой
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

// --- получаем статистику по турам по месяцам (agregation pipeline) --- //
const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year); // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' // разворачиваем массив
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // _id — это ключ группировки
        numTourStarts: { $sum: 1 }, // считаем количество туров в каждой группе
        tours: { $push: '$name' } // добавляем название тура в массив
      }
    },
    {
      $addFields: { month: '$_id' } // добавляем поле month для удобства
    },
    {
      $project: {
        _id: 0 // удаляем поле _id
      }
    },
    {
      $sort: { numTourStarts: -1 } // сортируем по количеству туров в порядке убывания
    },
    {
      $limit: 12 // ограничиваем количество документов если нужно
    }
  ]);

  // Отправляем успешный ответ с полученной статистикой
  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});

// Получаем все туры в пределах distance от точки lat,lng
const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // из URL: /tours-within/:distance/center/:latlng/unit/:unit

  // Разбираем строку "lat,lng" в числа
  const { lat, lng } = parseLatLng(latlng);

  // Простая валидация координат
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return next(
      new AppError(
        400,
        'Please provide latitude and longitude in the format lat,lng.'
      )
    );
  }

  // distance → в метры, потому что $geoNear с GeoJSON ждёт maxDistance в метрах
  const maxDistance = getMaxDistanceInMeters(Number(distance), unit);

  // Множитель для перевода метров в мили или километры в результате
  const distanceMultiplier = getDistanceMultiplier(unit);

  // Geo-агрегация: ищем точки вокруг заданной координаты
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        // От какой точки считать расстояние
        near: {
          type: 'Point',
          coordinates: [lng, lat] // ВАЖНО: [долгота, широта]
        },
        // В это поле Mongo запишет расстояние (до умножения — в метрах)
        distanceField: 'distance',
        // Ограничиваем радиус поиска (метры)
        maxDistance,
        // Конвертируем метры → ми/км прямо в результате
        distanceMultiplier,
        spherical: true // используем сферическую модель Земли
      }
    }
  ]);

  // Отправляем ответ
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours }
  });
});

// Считаем расстояние от точки lat,lng до КАЖДОГО тура
const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; // из URL: /distances/:latlng/unit/:unit

  // Разбираем координаты
  const { lat, lng } = parseLatLng(latlng);

  // Валидация
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return next(
      new AppError(
        400,
        'Please provide latitude and longitude in the format lat,lng.'
      )
    );
  }

  // Множитель для перевода из метров в нужную единицу (мили или км)
  const distanceMultiplier = getDistanceMultiplier(unit);

  // Агрегация: считаем расстояние до КАЖДОГО тура
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat] // [долгота, широта]
        },
        distanceField: 'distance', // поле, куда упадёт расстояние
        distanceMultiplier, // конвертация метров в ми/км
        spherical: true // используем сферическую модель Земли
      }
    },
    {
      // Берём только то, что нужно: расстояние и имя тура
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  // Отправляем ответ
  res.status(200).json({
    status: 'success',
    data: { data: distances }
  });
});

// ==================== ЭКСПОРТ ====================

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances
};
