class AppError extends Error {
  constructor(statusCode, message) {
    super(message);

    // Числовой код статуса
    this.statusCode = Number.isInteger(statusCode) ? statusCode : 500;

    // Текстовый статус: 'fail' для 4xx, 'error' для 5xx
    this.status = String(this.statusCode).startsWith('4') ? 'fail' : 'error';

    // Помечаем как операционную ошибку (для прод-выдачи сообщения)
    this.isOperational = true;

    // Чистый stack trace без конструктора
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
