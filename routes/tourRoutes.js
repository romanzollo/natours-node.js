const express = require('express');

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
  getMonthlyPlan
} = require('./../controllers/tourController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Метод router.param() позволяет задать middleware, который будет выполняться
// каждый раз, когда в URL встречается указанный параметр (в данном случае — 'id')
// router.param('id', checkID);

// ==================== СПЕЦИАЛЬНЫЕ РОУТЫ ====================
// aliasTopTours - middleware, который заранее «подставляет» limit/sort/fields,
// чтобы дальше getAllTours работал так, как будто юзер сам передал эти query-параметры
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); // получить 5 самых дешевых туров

router.route('/tour-stats').get(getTourStats); // получить статистику по турам
router.route('/monthly-plan/:year').get(getMonthlyPlan); // получить план по месяцам

// ==================== СТАНДАРТНЫЕ РОУТЫ ====================
router
  .route('/')
  .get(getAllTours) // получить все туры
  .post(createTour); // создать новый тур

router
  .route('/:id')
  .get(getTour) // получить тур по id
  .patch(updateTour) // обновить тур
  .delete(deleteTour); // удалить тур

module.exports = router;
