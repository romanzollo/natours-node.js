const jwt = require('jsonwebtoken'); // библеотека для создания токена
const { promisify } = require('util'); // утилита для промисификации
const crypto = require('crypto'); // встроенная библиотека для генерации хешей

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendMail = require('../utils/email');

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

// --- ПРОВЕРКА ПРАВ ПОЛЬЗОВАТЕЛЯ --- //
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated')); // нет req.user — нарушен порядок middleware
    }

    const role = String(req.user.role || '').toLowerCase(); // приводим к нижнему регистру
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action.')
      );
    }

    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Находим пользователя по отправленной почте
  const user = await User.findOne({
    email: req.body.email
  });

  if (!user) {
    return next(new AppError(404, 'There is no user with email address.'));
  }

  // 2) генерируем случайный токен сброса
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false
  }); // сохраняем изменения

  // 3) отправляем его пользователю по почте
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // отправляем почту
    await sendMail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    user.passwordResetToken = undefined; // удаляем токен
    user.passwordResetExpires = undefined; // удаляем время истечения
    await user.save({
      validateBeforeSave: false
    }); // сохраняем изменения

    return next(
      new AppError(
        500,
        'There was an error sending the email. Try again later!'
      )
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) определяем пользователя по токену
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // проверяем, что токен не истек (через mongoDB)
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) если токен не истек, и пользователь существует, устанавливаем новый пароль
  if (!user) {
    return next(new AppError(400, 'Token is invalid or has expired.'));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) обновляем changedPasswordAt пользователя
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });

  // 4) авторизуем пользователя, отправляем токен
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword
};
