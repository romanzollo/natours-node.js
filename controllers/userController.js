const User = require('../models/userModel'); // импортируем модель
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory'); // импортируем фабричный контроллер для CRUD операций

// Функция для фильтрации ненужных полей
const filterObj = (obj, ...allowed) => {
  const out = {};
  for (const key of Object.keys(obj)) {
    if (allowed.includes(key)) out[key] = obj[key];
  }

  return out;
};

// --- Обновить свой профиль --- //
const updateMe = catchAsync(async (req, res, next) => {
  // Позволяем менять только эти поля
  const ALLOWED_FIELDS = ['name', 'email'];

  // 1) Запрет смены пароля на этом роуте
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(400, 'Use /update-my-password for password changes.')
    );
  }

  // 2) Жёсткая фильтрация входных полей
  const data = filterObj(req.body, ...ALLOWED_FIELDS);

  // 3) Если email меняется — можно пометить как неподтверждённый/завести pendingEmail и отправить письмо
  //    Пример: if (data.email) { data.pendingEmail = data.email; delete data.email; /* send verify */ }

  // 4) Обновление с валидацией, сеттерами и безопасными опциями
  const updatedUser = await User.findByIdAndUpdate(req.user.id, data, {
    new: true, // вернуть обновлённый документ
    runValidators: true, // включить валидаторы апдейта
    context: 'query', // корректный контекст для валидаторов
    runSettersOnQuery: true // применить сеттеры на апдейте (важно для trim/lowercase)
  }).select('+id'); // пароля тут и так не будет, но следим, чтобы он не утёк

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// --- Удалить свой профиль --- //
const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

// --- Получить свой профиль --- //
const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = factory.getAll(User); // Получить всех пользователей
const getUser = factory.getOne(User); // Получить конкретного пользователя
const updateUser = factory.updateOne(User); // Обновить пользователя (не обновлять пароль таким образом)
const deleteUser = factory.deleteOne(User); // Удалить пользователя из БД (администратором)

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe
};
