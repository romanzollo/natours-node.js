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

// Определяем схему модели
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true, // полезно для строк
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0']
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
      min: [0, 'Price cannot be negative']
    }
  },
  {
    timestamps: true // опционально: добавляет createdAt и updatedAt
  }
);
// Создаем модель
const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
  name: 'The Forest Hiker',
  rating: 4.7,
  price: 497
});

const saveTour = async () => {
  try {
    const doc = await testTour.save();
    console.log(doc);
  } catch (error) {
    console.log('ERROR 💣: ', error);
  }
};
saveTour();

// Определяем порт, на котором будет работать сервер
const port = process.env.PORT || 8000;

// Запускаем сервер и начинаем прослушивать входящие HTTP-запросы на указанном порту
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
