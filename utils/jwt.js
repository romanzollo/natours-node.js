const jwt = require('jsonwebtoken');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  }); // стандартная подпись токена

/**
 * Унифицированная отправка токена и пользователя
 * @param {Object} user - документ пользователя (Mongoose)
 * @param {Number} statusCode - HTTP статус
 * @param {Object} res - Express Response
 * @param {Object} [options]
 *   - cookie: boolean | object  // включить установку httpOnly cookie
 *   - includeUser: boolean      // вернуть user в ответе
 */
const createSendToken = (user, statusCode, res, options = {}) => {
  const token = signToken(user._id); // генерация JWT по id

  // Не возвращаем пароль в ответе
  if (user.password) user.password = undefined; // базовая гигиена ответа

  // Установка httpOnly cookie при необходимости
  //   if (options.cookie) {
  //     const cookieOpts = {
  //       httpOnly: true, // cookie недоступна JS, защищает от XSS
  //       secure: process.env.NODE_ENV === 'production', // только по HTTPS в проде
  //       sameSite: 'lax', // уменьшает CSRF, можно 'strict' для большей защиты
  //       expires: new Date(
  //         Date.now() +
  //           (process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 7) * 24 * 60 * 60 * 1000
  //       ),
  //       ...(typeof options.cookie === 'object' ? options.cookie : {})
  //     };
  //     res.cookie('jwt', token, cookieOpts); // Set-Cookie с httpOnly JWT
  //   }

  const body = {
    status: 'success',
    token // токен в теле ответа для случаев, когда cookie не используется
  };

  if (options.includeUser) {
    body.data = { user };
  }

  return res.status(statusCode).json(body); // единый формат ответа
};

module.exports = { signToken, createSendToken };
