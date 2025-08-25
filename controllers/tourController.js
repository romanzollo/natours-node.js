const Tour = require('../models/tourModel'); // импортируем модель

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
    // Берём aliasQuery (если задан в middleware) или реальные query из запроса
    const qp = req.aliasQuery ?? req.query;
    console.log('Effective QUERY:', qp);

    // --- ПРЕДОБРАБОТКА ЗАПРОСА (фильтры) --- //
    let queryObj = { ...qp };

    // Исключаем служебные поля, которые не относятся к фильтрации
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Преобразуем gte, gt, lte, lt → $gte, $gt, $lte, $lt
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    // Преобразуем JSON в объект
    const finalFilter = JSON.parse(queryStr);

    // Базовый запрос
    let query = Tour.find(finalFilter);

    // --- СОРТИРОВКА --- //
    if (qp.sort) {
      const sortBy = qp.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // --- ОГРАНИЧЕНИЕ ПОЛЕЙ --- //
    if (qp.fields) {
      const fields = qp.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // по умолчанию убираем служебное поле __v
    }

    // --- ПАГИНАЦИЯ --- //
    const page = qp.page ? Number(qp.page) : 1;
    const limit = qp.limit ? Number(qp.limit) : 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (qp.page) {
      // считаем количество документов с учётом фильтра
      const numTours = await Tour.countDocuments(finalFilter);
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // --- ВЫПОЛНЯЕМ ЗАПРОС --- //
    const tours = await query;

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
      message: error
    });
  }
};

// --- создать новый тур --- //
const createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tours: newTour }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!'
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
      message: error
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

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours
};
