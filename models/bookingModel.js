const mongoose = require('mongoose');

// Схема бронирования тура.
// Здесь хранится "факт покупки": какой пользователь купил какой тур и за какую сумму.
const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user']
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price']
    },
    paid: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded'],
      default: 'paid'
    },
    // Уникальный идентификатор платежа в YooKassa.
    // Нужен для идемпотентности: не создаем дубликат Booking
    // если webhook был отправлен повторно.
    yookassaPaymentId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// Частые запросы:
// - список моих бронирований,
// - поиск брони по туру.
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ tour: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
