const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { confirmPaymentAndCreateBooking } = require('./bookingController');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Получаем все данные из коллекции Tours
  const tours = await Tour.find();

  // 2) Создаем шаблон

  // 3) Рендерим шаблон с данными из 1го шага
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Получаем нужные данные из коллекции Tours (включая отзывы и гиды)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    // reviews (virtual)
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError(404, 'There is no tour with that name.'));
  }

  // 2) Создаем шаблон
  // 3) Рендерим шаблон с данными из 1го шага
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});

exports.getAccount = catchAsync(async (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Fallback-поток без webhook:
  // если пользователь вернулся с paymentId в query, сами проверяем статус платежа
  // через API YooKassa и создаем Booking при status=succeeded.
  if (req.query?.paymentId) {
    await confirmPaymentAndCreateBooking(req.query.paymentId, req.user.id);
  }

  // 1) Получаем бронирования текущего пользователя.
  const bookings = await Booking.find({
    user: req.user.id,
    status: 'paid'
  });

  // Если подтвержденных бронирований пока нет, сразу рендерим пустой список.
  // Это защищает от ошибок приведения типов и дает корректный UX.
  if (bookings.length === 0) {
    return res.status(200).render('overview', {
      title: 'My Tours',
      tours: []
    });
  }

  // 2) Достаем массив id туров из бронирований.
  const tourIds = bookings.map(booking => String(booking.tour));

  // 3) Загружаем туры по id без операторного фильтра.
  // В проекте включен mongoose.set('sanitizeFilter', true), поэтому
  // операторы вроде $in в некоторых местах могут быть "обезврежены".
  // Этот вариант работает стабильно в нашей конфигурации.
  const toursRaw = await Promise.all(tourIds.map(id => Tour.findById(id))); // создаём массив промисов, где каждый Tour.findById(id) — это отдельный запрос к MongoDB
  const tours = toursRaw.filter(Boolean); // удаляем из массива все "ложные" значения (null, undefined, false и т.д.)
  /* 
    В данном контексте это нужно, чтобы отфильтровать случаи, когда:
        - Тур был удалён из базы, но бронирование осталось ("битая ссылка")
        - tourIds содержал невалидный ObjectId
        - Произошла тихая ошибка при загрузке
    */

  // 4) Рендерим ту же страницу overview, но уже только с купленными турами.
  return res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
