// Импортируем библиотеку mongoose
const mongoose = require('mongoose');

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

module.exports = Tour;
