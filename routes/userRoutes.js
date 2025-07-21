const express = require('express');

// Импортируем контроллеры для обработки запросов
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Определяем маршруты
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
