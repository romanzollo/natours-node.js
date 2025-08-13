// Импортируем библиотеку mongoose
const mongoose = require('mongoose');
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
  }
}

connectDB();

// Определяем порт, на котором будет работать сервер
const port = process.env.PORT || 8000;
// Запускаем сервер и начинаем прослушивать входящие HTTP-запросы на указанном порту
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
