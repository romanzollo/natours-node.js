const express = require('express');
const { xss } = require('express-xss-sanitizer'); // для санитизации входных данных

// Импортируем контроллеры для обработки запросов
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe
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
router.post('/signup', xss(), signup);
router.post('/login', xss(), login);
router.post('/forgot-password', xss(), forgotPassword);
// :token — добавляем xss() чтобы очистить req.params.token
router.patch('/reset-password/:token', xss(), resetPassword);
router.patch('/update-my-password', protect, xss(), updatePassword);
router.patch('/update-me', protect, xss(), updateMe);
router.delete('/delete-me', protect, xss(), deleteMe);
router.get('/me', protect, xss(), getMe, getUser);

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
  .post(xss(), createUser);
router
  .route('/:id')
  .all(xss())
  .get(getUser)
  .patch(restrictTo('admin'), updateUser)
  .delete(restrictTo('admin'), deleteUser);

/**
 * Админский маршрут для смены роли. Жёсткий whitelist реализован в контроллере:
 * он обновляет только поле role и валидирует его.
 */
router.patch('/:id/role', xss(), restrictTo('admin'), updateUserRole);

module.exports = router;
