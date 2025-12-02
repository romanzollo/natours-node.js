const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    timestamps: true, // опционально: добавляет createdAt и updatedAt
    toJSON: { virtuals: true }, // опционально: включает виртуальные поля
    toObject: { virtuals: true }
  }
);

// --- MONGOOSE MIDDLEWARES --- //
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// --- STATIC METHODS --- //
// Считаем средний рейтинг тура
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // Запускаем агрегирование по коллекции отзывов (Review)
  // this - так как метод статический
  const stats = await this.aggregate([
    {
      // Оставляем в выборке только отзывы конкретного тура
      $match: {
        tour: tourId
      }
    },
    {
      // Группируем все найденные отзывы по полю tour
      $group: {
        _id: '$tour', // группировка по id тура
        nRating: {
          $sum: 1 // считаем количество отзывов (каждый документ = 1)
        },
        avgRating: {
          $avg: '$rating' // считаем среднее значение поля rating
        }
      }
    }
  ]);
  console.log(stats);

  // Обновляем сам тур: записываем количество и средний рейтинг
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats?.nRating || 0, // если отзывов нет, ставим 0
    ratingsAverage: stats?.avgRating || 4.5 // и средний рейтинг 4.5
  });
};

// post 'save' middleware срабатывает после сохранения нового отзыва
reviewSchema.post('save', function() {
  // this — это текущий документ Review
  // this.constructor — это модель Review, у которой мы только что объявили статический метод calcAverageRatings
  // Передаём id тура, к которому относится этот отзыв
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
