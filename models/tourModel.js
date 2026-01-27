const mongoose = require('mongoose'); // Импортируем библиотеку mongoose
const slugify = require('slugify'); // библиотека для генерации slug
const validator = require('validator'); // библиотека для кастомных валидаций

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
      //   validate: [validator.isAlpha, 'Tour name must only contain characters'] // проверка на наличие только букв
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
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(value) {
          // this будет работать только при создании нового документа (при обновлении документа this будет undefined)
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
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
    },
    // географическое положение начала тура
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // массив географических точек (денормализация)
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // Массив ID гидов (пользователей), которые ведут этот тур
    // В БД хранится: ["64f...abc", "64f...def"] — просто ссылки на коллекцию users
    // После populate: [{name: 'John', email: '...'}, {name: 'Jane', ...}]
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Mongoose заменит ID на полные документы из модели User
      }
    ]
  },
  {
    timestamps: true, // опционально: добавляет createdAt и updatedAt
    toJSON: { virtuals: true }, // опционально: включает виртуальные поля
    toObject: { virtuals: true }
  }
);

// --- индексируем поля для быстрого поиска --- //
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // индексируем географическое положение - геопоиск

// Виртуальные поля
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// ВИРТУАЛЬНОЕ ПОЛЕ reviews (НЕ хранится в БД)
// Обратноe отношение: находит ВСЕ отзывы, где tour = this._id
// Требует РУЧНОГО populate в контроллере: .populate('reviews')
tourSchema.virtual('reviews', {
  ref: 'Review', // модель Review
  foreignField: 'tour', // в Review.schema есть поле: tour: ObjectId(ref: 'Tour')
  localField: '_id' // связываем по ID этого тура
});

// --- MONGOOSE MIDDLEWARES --- //
// middlewares документа: срабатывает перед сохранением и созданием (только .save() и .create()) (в insertMany() не сработает)
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true }); // добавляем slug

  next();
});

// Автоматический populate гидов ПРИ ВСЕХ запросах find()
// Срабатывает ДО выполнения Tour.find(), Tour.findOne() и т.д.
// Исключаем поле passwordChangedAt из выдаваемых данных пользователей
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-passwordChangedAt' // исключаем поле при выдаче данных
  });

  next();
});

/* убрал из за конфликта так как заставляют Mongoose пытаться привести операторный объект к Boolean при query casting */
// // middleware запроса
// tourSchema.pre(/^find/, function(next) {
//   this.find({ secretTour: { $ne: true } });

//   next();
// });

// // aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // добавляем фильтр $match

//   next();
// });

// ------------------------------- //

// Создаем модель
const Tour = mongoose.model('Tour', tourSchema); // mongoose автоматически преобразует имя 'Tour' в нижний регистр и множественное число: коллекция в MongoDB будет называться tours

module.exports = Tour;
