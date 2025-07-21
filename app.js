const express = require('express');

// Подключаем библиотеку morgan — логгер HTTP-запросов (для отладки)
const morgan = require('morgan');

// Импортируем маршруты для туров из внешнего файла
const tourRouter = require('./routes/tourRoutes');
// Импортируем маршруты для пользователей из внешнего файла
const userRouter = require('./routes/userRoutes');

// Создаём экземпляр приложения Express
const app = express();

// ==================== MIDDLEWARE ====================
// Middleware — функции, которые обрабатывают входящие запросы до того, как они попадут в маршруты

// Логгируем информацию о запросах (метод, путь, статус, время) — только для режима разработки
app.use(morgan('dev'));

// Встроенный middleware: парсит тело входящих запросов из JSON в объект req.body
// Теперь мы можем получать данные из POST/PATCH и других запросов с JSON
app.use(express.json());

// Пример кастомного middleware
// Выполняется при каждом запросе, выводит сообщение в консоль
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next(); // Обязательно вызываем next(), чтобы передать управление следующему middleware или маршруту
});

// Другой пример middleware: добавляем к запросу текущее время
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

module.exports = app;
