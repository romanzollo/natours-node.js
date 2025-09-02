const mongoose = require('mongoose'); // Импортируем библиотеку mongoose
const slugify = require('slugify'); // Импортируем библиотеку slugify

// Определяем схему модели тура (структуру и правила для документа тура)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour must have a name'],
      unique: true,
      trim: true, // автоматически удаляет пробелы в начале и конце строки
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // округляем до одной десятичной
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
      min: [0, 'Price cannot be negative']
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false // false - поле не будет возвращаться в ответе
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true, // опционально: добавляет createdAt и updatedAt
    toJSON: { virtuals: true }, // опционально: включает виртуальные поля
    toObject: { virtuals: true }
  }
);

// Виртуальное поле
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// --- MONGOOSE MIDDLEWARES --- //
// middleware документа: срабатует перед сохранением и созданием (только .save() и .create()) (в insertMany() не сработает)
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true }); // добавляем slug

  next();
});

// middleware запроса
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  next();
});

// aggregation middleware
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // добавляем фильтр $match

  next();
});

// ------------------------------- //

// Создаем модель
const Tour = mongoose.model('Tour', tourSchema); // mongoose автоматически преобразует имя 'Tour' в нижний регистр и множественное число: коллекция в MongoDB будет называться tours

module.exports = Tour;
