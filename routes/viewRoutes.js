const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm
} = require('../controllers/viewController');
const { protect, isLoggedIn } = require('../controllers/authController');

const router = express.Router();

// предоставляем доступ к данным пользователя через middleware во всех маршрутах
router.use(isLoggedIn);

router.get('/', getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', getLoginForm);

module.exports = router;
