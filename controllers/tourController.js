const Tour = require('../models/tourModel'); // импортируем модель
const APIFeatures = require('../utils/apiFeatures');

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
const getAllTours = async (req, res) => {
  try {
    // --- ВЫПОЛНЯЕМ ЗАПРОС --- //
    const features = new APIFeatures(
      Tour.find(),
      req.query,
      req.aliasQuery // сюда подаём "виртуальные" параметры
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // валидация страницы теперь тут
    await features.validatePage(Tour);

    const tours = await features.query;

    // --- ОТПРАВЛЯЕМ ОТВЕТ --- //
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- получить конкретный тур --- //
const getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- создать новый тур --- //
const createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      //   data: { tours: newTour }
      data: { tour: newTour }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- обновить конкретный тур --- //
const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // вернуть обновлённый документ
      runValidators: true // запускать валидацию схемы
    });

    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- удалить конкретный тур --- //
const deleteTour = async (req, res) => {
  try {
    const deleted = await Tour.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tour not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: error.message
    });
  }
};

// --- получаем статистику по турам (agregation pipeline) --- //
const getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    // Обрабатываем ошибку и отправляем ответ с кодом 500
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: error.message
    });
  }
};

// --- получаем статистику по турам по месяцам (agregation pipeline) --- //
const getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    // Обрабатываем ошибку и отправляем ответ с кодом 500
    res.status(500).json({
      status: 'fail',
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== ЭКСПОРТ ====================

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan
};
