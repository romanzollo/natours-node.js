const jwt = require('jsonwebtoken'); // библеотека для создания токена

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// --- ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ТОКЕНА --- //
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// --- РЕГИСТРАЦИЯ --- //
const signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // создаем токен
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

// --- АВТОРИЗАЦИЯ --- //
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Проверяем наличие email и пароля
  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password!'));
  }

  // 2) проверяем существует ли пользователь и совпадают ли пароли
  const user = await User.findOne({ email }).select('+password'); // + - для выборки пароля отображение которого отключено в модели пользователя через select: false

  // при таком подходе проверка паролей будет только в случае если пользователь существует👍
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, 'Incorrect email or password'));
  }

  // 3) если все ОК, создаем и отправляем токен пользователю
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

module.exports = {
  signup,
  login
};
