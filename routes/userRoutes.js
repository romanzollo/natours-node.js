const express = require('express');

// Импортируем контроллеры для обработки запросов
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('../controllers/authController');
const { updateUserRole } = require('../controllers/userAdminController');

// Создаём экземпляр маршрутизатора Express
const router = express.Router();

/**
 * Публичные роуты авторизации
 * Должны идти первыми и без защиты
 */
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.patch('/update-my-password', protect, updatePassword);

/**
 * Ниже — защищённые роуты (нужен токен)
 */
router.use(protect);

/**
 * CRUD пользователей — доступ по необходимости.
 * Например, GET всех пользователей и модификации — только для админов.
 * Если нужно сделать часть открытой — убрать restrictTo там, где не нужно.
 */
router
  .route('/')
  .get(getAllUsers)
  .post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(restrictTo('admin'), updateUser)
  .delete(restrictTo('admin'), deleteUser);

/**
 * Админский маршрут для смены роли. Жёсткий whitelist реализован в контроллере:
 * он обновляет только поле role и валидирует его.
 */
router.patch('/:id/role', restrictTo('admin'), updateUserRole);

module.exports = router;
