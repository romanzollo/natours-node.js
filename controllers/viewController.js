const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Получаем все данные из коллекции Tours
  const tours = await Tour.find();

  // 2) Создаем шаблон

  // 3) Рендерим шаблон с данными из 1го шага
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Получаем нужные данные из коллекции Tours (включая отзывы и гиды)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    // reviews (virtual)
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError(404, 'There is no tour with that name.'));
  }

  // 2) Создаем шаблон
  // 3) Рендерим шаблон с данными из 1го шага
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});
