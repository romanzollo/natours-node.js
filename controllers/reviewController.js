const Review = require('../models/reviewModel'); // импортируем модель
const catchAsync = require('../utils/catchAsync');

// --- получаем все отзывы --- //
const getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  // --- ОТПРАВЛЯЕМ ОТВЕТ --- //
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
});

// --- создать новый отзыв --- //
const createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { review: newReview }
  });
});

module.exports = {
  getAllReviews,
  createReview
};
