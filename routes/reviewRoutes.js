const express = require('express');

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // mergeParams - добавляет параметры из родительского маршрута (объединяем их)

router
  .route('/')
  .get(protect, getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .patch(protect, updateReview)
  .delete(protect, restrictTo('user', 'admin'), deleteReview);

module.exports = router;
