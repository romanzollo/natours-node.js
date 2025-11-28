const Review = require('../models/reviewModel'); // импортируем модель
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // импортируем фабричный контроллер для CRUD операций

// --- получаем все отзывы --- //
const getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId }; // если есть tourId в params

  const reviews = await Review.find(filter);

  // --- ОТПРАВЛЯЕМ ОТВЕТ --- //
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
});

const setTourUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

const createReview = factory.createOne(Review); // создать конкретный отзыв
const updateReview = factory.updateOne(Review); // обновить конкретный отзыв
const deleteReview = factory.deleteOne(Review); // удалить конкретный отзыв

module.exports = {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds
};
