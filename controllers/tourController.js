const Tour = require('../models/tourModel'); // импортируем модель

// --- получить все туры --- //
const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success'
    // results: tours.length,
    // data: {
    //   tours
    // }
  });
};

// --- получить конкретный тур --- //
const getTour = (req, res) => {
  const id = req.params.id * 1; // * 1 — чтобы преобразовать строку в число
  //   const tour = tours.find(el => el.id === id);

  //   // проверяем на наличие тура
  //   if (!tour) {
  //     return res.status(404).json({
  //       status: 'fail',
  //       message: 'Invalid ID'
  //     });
  //   }

  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       tour
  //     }
  //   });
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
const updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>'
    }
  });
};

// --- удалить конкретный тур --- //
const deleteTour = (req, res) => {
  // проверяем на наличие тура
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
};

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour
};
