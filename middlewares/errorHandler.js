const AppError = require('../utils/appError');

const handleDuplicateFieldsDB = err => {
  // MongoServerError 11000: берем поле и значение из драйвера
  const field = err?.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
  const value = err?.keyValue ? err.keyValue[field] : undefined;
  const message =
    value !== undefined
      ? `Duplicate field value: ${JSON.stringify(
          value
        )}. Please use another value!`
      : 'Duplicate field value. Please use another value!';

  return new AppError(400, message);
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;

  return new AppError(400, message);
};

const sendErrorDev = (err, res, code, status) => {
  res.status(code).json({
    status,
    message: err.message || 'Internal Server Error',
    // error: {
    //   name: err.name,
    //   code: err.code,
    //   details: err.details
    // },
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res, code, status) => {
  // В продакшене не раскрываем внутренности.
  // 4xx обычно операционные, 5xx — программные/непредвиденные.
  const isOperational =
    typeof err.isOperational === 'boolean'
      ? err.isOperational
      : String(code).startsWith('4');

  res.status(code).json({
    status,
    message: isOperational
      ? err.message || 'Bad Request'
      : 'Internal Server Error'
  });
};

module.exports = (err, req, res, next) => {
  // Обязательно: если ответ уже начался, менять его опасно — передаём ошибку встроенному обработчику Express, чтобы корректно закрыть соединение.
  if (res.headersSent) {
    return next(err);
  }

  // Нормализация кода статуса по правилам Express
  let code;
  if (Number.isInteger(err?.statusCode)) {
    code = err.statusCode;
  } else if (Number.isInteger(err?.status)) {
    code = err.status;
  } else {
    code = 500;
  }
  const normalizedCode = code >= 400 && code < 600 ? code : 500;

  // Нормализация текстового статуса
  const status =
    typeof err?.status === 'string'
      ? err.status
      : String(normalizedCode).startsWith('4')
      ? 'fail'
      : 'error';

  // определяем окружение
  const env = process.env.NODE_ENV || 'development'; // по умолчанию считаем dev, если переменная не установлена

  // в dev: возвращаем подробный JSON через sendErrorDev — удобно для отладки.
  if (env === 'development') {
    return sendErrorDev(err, res, normalizedCode, status);
  } else if (env === 'production') {
    // Тщательно копируем ошибку, сохраняя прототип и message/name
    let error = Object.create(Object.getPrototypeOf(err));
    Object.assign(error, err);

    // Каст-ошибка => 400
    if (error?.name === 'CastError') error = handleCastErrorDB(error);
    if (error?.code === 11000) error = handleDuplicateFieldsDB(error);

    // Единообразно получаем финальный код/статус
    const code = Number.isInteger(error.statusCode)
      ? error.statusCode
      : normalizedCode;
    const status = String(code).startsWith('4') ? 'fail' : 'error';

    // в  prod: возвращаем безопасный JSON через sendErrorProd — не раскрываем стек и внутренности.
    return sendErrorProd(error, res, code, status);
  }
};
