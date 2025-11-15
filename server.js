// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК - 1) До всего основного кода: ловим синхронные исключения
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  // Логируем имя/сообщение отдельно, если нужно
  console.error(err.name, err.message);
  process.exit(1);
});

// Импортируем библиотеку mongoose
const mongoose = require('mongoose');
// ВКЛЮЧАЕМ БЕЗОПАСНУЮ ФИЛЬТРАЦИЮ ОПЕРАТОРОВ ДЛЯ ЗАПРОСОВ
mongoose.set('sanitizeFilter', true);

// Загружаем переменные окружения из файла config.env
require('dotenv').config();
/**
 * Импортируем настроенный экземпляр приложения Express из файла app.js
 * Там уже настроены middleware, маршруты и прочая логика сервера
 */
const app = require('./app');

// безопасный способ не хранить пароль напрямую в строке подключения
// заменяем плейсхолдер '<PASSWORD>' на реальный пароль из переменных окружения
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Обработчики событий
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  setTimeout(connectDB, 5000); // Пробуем переподключиться через 5 секунд
});

/**
 * Асинхронная функция для подключения к базе данных MongoDB
 * Использует библиотеку Mongoose для установления соединения
 */
async function connectDB() {
  try {
    await mongoose.connect(DB);
    console.log('DB connection successful!');
  } catch (error) {
    console.error('DB connection error:', error);

    // Прокидываем наверх, чтобы сработал process.on('unhandledRejection', 'SIGTERM', 'SIGINT')
    throw error;
  }
}

connectDB();

// Определяем порт, на котором будет работать сервер
const port = process.env.PORT || 8000;
// Запускаем сервер и начинаем прослушивать входящие HTTP-запросы на указанном порту
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК - 2) Ловим промисы без catch (асинхронные отказы)
process.on('unhandledRejection', async err => {
  console.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
  // Сначала перестаём принимать новые соединения
  server.close(async () => {
    try {
      // Аккуратно закрываем Mongo-подключение (Mongoose 8)
      await mongoose.connection.close();
    } catch (e) {
      console.error('Error closing Mongo connection:', e);
    } finally {
      process.exit(1);
    }
  });
});

// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК - 3) Graceful shutdown по сигналам (напр., Heroku/K8s)
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } finally {
      console.log('Process terminated');
      // Не вызываем process.exit(0) — SIGTERM сам завершит процесс
    }
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully');
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } finally {
      process.exit(0);
    }
  });
});
