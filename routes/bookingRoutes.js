const express = require('express');

const {
  getCheckoutSession,
  yookassaWebhook,
  confirmPayment
} = require('../controllers/bookingController');

const { protect } = require('../controllers/authController');

const router = express.Router();

// Вебхук должен быть ДО protect:
// YooKassa не авторизуется JWT токеном пользователя.
router.post('/webhook-yookassa', yookassaWebhook);

router.use(protect);

router
  .route('/checkout-session/:tourId')
  .get(getCheckoutSession)
  .post(getCheckoutSession);
router.post('/confirm-payment/:paymentId', confirmPayment);

module.exports = router;
