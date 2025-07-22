// Загружаем переменные окружения из файла config.env
require('dotenv').config();

// Импортируем настроенный экземпляр приложения Express из файла app.js
// Там уже настроены middleware, маршруты и прочая логика сервера
const app = require('./app');

// Определяем порт, на котором будет работать сервер
const port = process.env.PORT || 8000;

// Запускаем сервер и начинаем прослушивать входящие HTTP-запросы на указанном порту
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
