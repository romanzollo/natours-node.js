const jwt = require('jsonwebtoken'); // библеотека для создания токена
const { promisify } = require('util'); // утилита для промисификации
const crypto = require('crypto'); // встроенная библиотека для генерации хешей

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendMail = require('../utils/email');
const { createSendToken } = require('../utils/jwt'); // импортируем функцию отправки токена

// --- РЕГИСТРАЦИЯ --- //
const signup = catchAsync(async (req, res, next) => {
  // whitelisting
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');

  if (!name || !email || !password || !passwordConfirm) {
    return next(
      new AppError(400, 'Provide name, email, password, passwordConfirm.')
    );
  }

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm
  });

  return createSendToken(newUser, 201, res, { includeUser: true }); // вернуть токен + пользователя
});

// --- АВТОРИЗАЦИЯ --- //
const login = catchAsync(async (req, res, next) => {
  // 0) Белый список входа
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body.password || '');

  // 1) Проверяем наличие email и пароля
  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password!'));
  }

  // 2) Ищем только по whitelisted полю и ЖЁСТКО фильтруем active
  const user = await User.findOne({ email, active: true }).select('+password'); // + - для выборки пароля отображение которого отключено в модели пользователя через select: false

  // 3) при таком подходе проверка паролей будет только в случае если пользователь существует👍
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(401, 'Incorrect email or password'));
  }

  // 4) если все ОК, создаем и отправляем токен пользователю
  return createSendToken(user, 200, res); // токен и стандартизированный ответ
});

// --- ПРОВЕРКА ТОКЕНА --- //
const protect = catchAsync(async (req, res, next) => {
  // 1) whitelisting
  const auth = req.headers.authorization || '';
  const hasBearer = auth.startsWith('Bearer ');
  const token = hasBearer ? auth.slice(7) : null;

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
  const allowed = roles.map(r => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated')); // нет req.user — нарушен порядок middleware
    }

    const role = String(req.user.role || '').toLowerCase(); // приводим к нижнему регистру
    if (!allowed.includes(role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action.')
      );
    }

    next();
  };
};

// --- СБРОС ПАРОЛЯ --- //
const forgotPassword = catchAsync(async (req, res, next) => {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  if (!email) return next(new AppError(400, 'Email is required.'));

  // 1) Находим пользователя по отправленной почте
  const user = await User.findOne({ email }).select('+email');
  if (!user)
    return next(new AppError(404, 'There is no user with email address.'));

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

// --- СБРОС ПАРОЛЯ --- //
const resetPassword = catchAsync(async (req, res, next) => {
  // 1) серверное хеширование токена
  const tokenRaw = String(req.params.token || '');
  if (!tokenRaw) return next(new AppError(400, 'Token is required.'));

  // 2) определяем пользователя по токену + серверное хеширование токена
  const hashedToken = crypto
    .createHash('sha256')
    .update(tokenRaw)
    .digest('hex');

  // 3) устойчивый поиск через агрегат ($expr для сравнения дат)
  const now = new Date();
  const docs = await User.aggregate([
    {
      $match: {
        passwordResetToken: hashedToken
      }
    },
    {
      $match: {
        $expr: {
          $gt: ['$passwordResetExpires', now]
        }
      }
    }
  ]);
  const found = docs[0];
  if (!found) {
    return next(new AppError(400, 'Token is invalid or has expired.'));
  }

  // 4) загрузить документ и сохранить (чтобы сработали pre('save'))
  const user = await User.findById(found._id).select('+password');
  if (!user) {
    return next(new AppError(400, 'Token is invalid or has expired.'));
  }

  // whitelisting
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');
  if (!password || !passwordConfirm) {
    return next(new AppError(400, 'Provide password and passwordConfirm.'));
  }
  if (password !== passwordConfirm) {
    return next(new AppError(400, 'Passwords are not the same'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) обновляем changedPasswordAt пользователя

  // 4) авторизуем пользователя, отправляем токен
  return createSendToken(user, 200, res);
});

// --- ОБНОВЛЕНИЕ ПАРОЛЯ --- //
const updatePassword = catchAsync(async (req, res, next) => {
  // 0) whitelisting
  const passwordCurrent = String(req.body.passwordCurrent || '');
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');

  if (!passwordCurrent || !password || !passwordConfirm) {
    return next(
      new AppError(
        400,
        'Provide passwordCurrent, password and passwordConfirm.'
      )
    );
  }
  if (password !== passwordConfirm) {
    // перехватываем несоответствие до save, чтобы вернуть чистый 400
    return next(new AppError(400, 'Passwords are not the same'));
  }

  // 1) получаем пользователя из базы данных (с паролем)
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new AppError(401, 'Not authenticated'));

  // 2) Проверяем текущий пароль — здесь вернём 401 при неверном
  const isCorrect = await user.correctPassword(passwordCurrent, user.password);
  if (!isCorrect) {
    return next(new AppError(401, 'Your current password is wrong.'));
  }

  // 3) Применяем новые значения и сохраняем
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate не сработает,

  // 4) Логиним заново и выходим
  return createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword
};
