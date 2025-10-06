// middlewares/errorHandler.js

const sendErrorDev = (err, res, code, status) => {
  res.status(code).json({
    status,
    message: err.message || 'Internal Server Error',
    error: {
      name: err.name,
      code: err.code,
      details: err.details
    },
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
  }
  // в  prod: возвращаем безопасный JSON через sendErrorProd — не раскрываем стек и внутренности.
  return sendErrorProd(err, res, normalizedCode, status);
};
