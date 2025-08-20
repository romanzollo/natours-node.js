const Tour = require('../models/tourModel'); // импортируем модель

// --- получить все туры --- //
const getAllTours = async (req, res) => {
  try {
    console.log(req.query);

    // --- ПРЕДОБРАБОТКА ЗАПРОСА (формируем запрос) --- //
    // 1) Клонируем объект запроса
    let queryObj = { ...req.query };

    // 2) Исключаем специальные поля
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 3) Преобразуем gte, gt, lte, lt в $gte, $gt, $lte, $lt
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    // 4) Парсим обратно в объект
    const finalQueryObj = JSON.parse(queryStr);

    // 5) Передаем запрос
    let query = Tour.find(finalQueryObj);

    // --- СОРТИРОВКА --- //
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy); // sort - встроенный метод в mongoose
    } else {
      query = query.sort('-createdAt'); // по умолчанию сортируем по дате создания
    }

    // --- ОГРАНИЧЕНИЕ ПОЛЕЙ --- //
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // ВЫПОЛНЯЕМ ЗАПРОС
    const tours = await query;

    // ОТПРАВЛЯЕМ ОТВЕТ
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
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
    // const tour = Tour.findOne({ _id: req.params.id }); - другой вариант

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
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
    //   const newTour = new Tour({});
    //   newTour.save();

    // более лаконичный вариант
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tours: newTour
      }
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
      new: true, // возвращает обновлённый документ
      runValidators: true // запускает валидацию по схеме
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
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

    // Если тур не найден, возвращаем ошибку 404
    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tour not found'
      });
    }

    // Успешное удаление: статус 204 (No Content)
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    // Обработка ошибок (например, некорректный ID)
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
  deleteTour
};
