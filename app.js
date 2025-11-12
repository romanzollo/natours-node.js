const express = require('express');
// Подключаем библиотеку morgan — логгер HTTP-запросов (для отладки)
const morgan = require('morgan');
const qs = require('qs'); // для парсинга строки запроса
const rateLimit = require('express-rate-limit'); // для лимита запросов
const helmet = require('helmet'); // для защиты HTTP-headers

// Импортируем маршруты для туров из внешнего файла
const tourRouter = require('./routes/tourRoutes');
// Импортируем маршруты для пользователей из внешнего файла
const userRouter = require('./routes/userRoutes');
// Импортируем модуль для работы с ошибками
const AppError = require('./utils/appError');
// Импортируем глобальный обработчик ошибок
const errorHandler = require('./middlewares/errorHandler');

// Создаём экземпляр приложения Express
const app = express();

// ==================== GLOBAL MIDDLEWARE ====================
// Middleware — функции, которые обрабатывают входящие запросы до того, как они попадут в маршруты

// Логгируем информацию о запросах (метод, путь, статус, время) — только для режима разработки
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Защита HTTP-заголовков
app.use(helmet());

// Реализуем лимит запросов
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Встроенный middleware: парсит тело входящих запросов из JSON в объект req.body
// Теперь мы можем получать данные из POST/PATCH и других запросов с JSON
app.use(
  express.json({
    limit: '10kb' // ограничиваем размер тела запроса
  })
);

// Безопасный парсинг строки запроса с ограничениями глубины/кол-ва параметров
app.set('query parser', str =>
  qs.parse(str, {
    depth: 10, // ограничиваем вложенность
    parameterLimit: 1000, // ограничиваем кол-во параметров
    strictDepth: true, // бросаем ошибку при превышении глубины
    allowPrototypes: false // не трогаем прототипы объектов
  })
);

app.use(express.static(`${__dirname}/public`));

// Другой пример middleware: добавляем к запросу текущее время (для теста)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // сохраняем время запроса в объекте req

  next();
});

// ==================== МАРШРУТИЗАЦИЯ ====================

// Подключаем маршруты для туров по префиксу '/api/v1/tours'
// Все маршруты из tourRouter будут доступны с этого пути
// Например: GET /api/v1/tours, POST /api/v1/tours и т.д.
app.use('/api/v1/tours', tourRouter);

// Подключаем маршруты для пользователей по префиксу '/api/v1/users'
// Например: GET /api/v1/users, DELETE /api/v1/users/5
app.use('/api/v1/users', userRouter);

// 404: в конец, до глобального обработчика
app.use((req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Глобальный обработчик ошибок (обязательно последним)
app.use(errorHandler);

module.exports = app;
