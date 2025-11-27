const express = require('express');

const {
  getAllReviews,
  createReview
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // mergeParams - добавляет параметры из родительского маршрута (объединяем их)

router
  .route('/')
  .get(protect, getAllReviews)
  .post(protect, restrictTo('user'), createReview);

module.exports = router;
