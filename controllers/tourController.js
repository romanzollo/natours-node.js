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

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours
};
