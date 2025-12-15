const express = require('express');
const { xss } = require('express-xss-sanitizer'); // для санитизации входных данных

// Импортируем контроллеры для обработки запросов
// Каждая функция отвечает за определённое действие: получение всех туров, создание, обновление и т.д.
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin
} = require('./../controllers/tourController');
const { protect, restrictTo } = require('./../controllers/authController');
const canSeeSecretTours = require('../middlewares/canSeeSecretTours');
const reviewRouter = require('./reviewRoutes');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Метод router.param() позволяет задать middleware, который будет выполняться
// каждый раз, когда в URL встречается указанный параметр (в данном случае — 'id')
// router.param('id', checkID);

// ==================== СПЕЦИАЛЬНЫЕ РОУТЫ ====================
// aliasTopTours - middleware, который заранее «подставляет» limit/sort/fields,
// чтобы дальше getAllTours работал так, как будто юзер сам передал эти query-параметры
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); // получить 5 самых дешевых туров

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(getTourStats); // получить статистику по турам
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan); // получить план по месяцам

// /tours-within?distance=300&center=-35,50&unit=mi - вариант с query-параметрами
// /tours-within/300/center/48.851821,2.348857/unit/mi - вариант с path-параметрами (наш вариант)
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin); // distance-расстояние поиска, center/:latlng - наши координаты, unit - единица измерения

// ==================== СТАНДАРТНЫЕ РОУТЫ ====================
router
  .route('/')
  .get(getAllTours) // получить все туры
  .post(protect, restrictTo('admin', 'lead-guide'), createTour); // создать новый тур

router
  .route('/:id', xss())
  .get(getTour) // получить тур по id
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour) // обновить тур
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour); // удалить тур

module.exports = router;
