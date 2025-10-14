const express = require('express');

// Импортируем контроллеры для обработки запросов
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { singup } = require('../controllers/authController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

// Определяем маршруты
router
  .route('/')
  .get(getAllUsers)
  .post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

router.post('/singup', singup);

module.exports = router;
