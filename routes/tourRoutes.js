const express = require('express');

// Импортируем контроллеры для обработки запросов
// Каждая функция отвечает за определённое действие: получение всех туров, создание, обновление и т.д.
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  checkID,
} = require('./../controllers/tourController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Метод router.param() позволяет задать middleware, который будет выполняться
// каждый раз, когда в URL встречается указанный параметр (в данном случае — 'id')
// Здесь: при любом запросе с :id (например, /api/v1/tours/5) сначала вызывается checkID
// Это удобно для проверки валидности ID, логирования или предварительной загрузки данных
router.param('id', checkID);

// Определяем маршруты
router.route('/').get(getAllTours).post(createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
