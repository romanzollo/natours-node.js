class AppError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = Number(statusCode) || 500;
    this.status = String(this.statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
