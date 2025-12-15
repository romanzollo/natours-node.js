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

// --- получаем туры в радиусе (agregation pipeline) --- //
const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // distance-расстояние поиска, latlng - наши координаты, unit - единица измерения
  const [lat, lng] = latlng.split(','); // разбиваем наши координаты

  // maxDistance в МЕТРАХ для GeoJSON!
  const maxDistance = unit === 'mi' ? distance * 1609.34 : distance * 1000;

  if (!lat || !lng) {
    return next(new AppError(400, 'Please provide lat,lng'));
  }

  // выполняем агрегацию
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)]
        },
        distanceField: 'distance', // расстояние в метрах
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001, // конвертация в мили/км
        spherical: true,
        maxDistance: maxDistance // в МЕТРАХ!
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours }
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
  getToursWithin
};
