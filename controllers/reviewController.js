const Review = require('../models/reviewModel'); // импортируем модель
const factory = require('./handlerFactory'); // импортируем фабричный контроллер для CRUD операций
// const catchAsync = require('../utils/catchAsync');

const setTourUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

const getAllReviews = factory.getAll(Review, req => {
  // Возвращаем фильтр в зависимости от наличия параметра tourId
  return req.params.tourId ? { tour: req.params.tourId } : {};
}); // получить все отзывы
const getReview = factory.getOne(Review); // получить конкретный отзыв
const createReview = factory.createOne(Review); // создать конкретный отзыв
const updateReview = factory.updateOne(Review); // обновить конкретный отзыв
const deleteReview = factory.deleteOne(Review); // удалить конкретный отзыв

module.exports = {
  getReview,
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds
};
