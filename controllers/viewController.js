const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

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

exports.getTour = (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker'
  });
};
