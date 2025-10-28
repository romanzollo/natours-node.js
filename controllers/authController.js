const jwt = require('jsonwebtoken'); // библеотека для создания токена
const { promisify } = require('util'); // утилита для промисификации

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

  // подстраховка, если нет transform
  if (newUser.password) newUser.password = undefined;

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

// --- ПРОВЕРКА ТОКЕНА --- //
const protect = catchAsync(async (req, res, next) => {
  // 1) Проверяем наличие токена
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // Bearer token
  }

  if (!token) {
    return next(
      new AppError(401, 'You are not logged in! Please log in to get access.')
    );
  }

  // 2) Проверяем валидность токена
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Проверяем существует ли пользователь
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        401,
        'The user belonging to this token does no longer exist.'
      )
    );
  }

  // 4) Проверяем сменил ли пользователь пароль после получения токена
  // ВАЖНО: прерываем, если пароль меняли после выдачи токена
  // iat - время создания токена
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(401, 'User recently changed password! Please log in again.')
    );
  }

  req.user = currentUser; // включаем в запрос все данные о пользователе (пригодится в будущем)
  next(); // предоставляем доступ к защищенному маршруту
});

module.exports = {
  signup,
  login,
  protect
};
