const Tour = require('../models/tourModel'); // импортируем модель

// --- получить все туры --- //
const getAllTours = async (req, res) => {
  try {
    // СОЗДАЕМ ЗАПРОС
    const queryObj = { ...req.query }; // клонируем объект
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // поля для исключения
    excludedFields.forEach(el => delete queryObj[el]); // удаляем поля

    console.log(req.query, queryObj);

    const query = Tour.find(queryObj); // применяем сортировку

    // const query = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

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
      message: error
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
