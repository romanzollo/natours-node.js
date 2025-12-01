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

// Защищаем все следующие роуты (чтобы не писать protect в каждом роуте)
router.use(protect);

router.patch('/update-my-password', xss(), updatePassword);
router.patch('/update-me', xss(), updateMe);
router.delete('/delete-me', xss(), deleteMe);
router.get('/me', xss(), getMe, getUser);

// Разрешаем доступ к следующим роутам только админам
router.use(restrictTo('admin'));

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
router.patch('/:id/role', xss(), updateUserRole);

module.exports = router;
