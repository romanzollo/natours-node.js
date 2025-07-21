const express = require('express');

// Импортируем контроллеры для обработки запросов
// Каждая функция отвечает за определённое действие: получение всех туров, создание, обновление и т.д.
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
} = require('./../controllers/tourController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Определяем маршруты
router.route('/').get(getAllTours).post(createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
