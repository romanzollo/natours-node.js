const crypto = require('crypto');
const YooKassa = require('yookassa');

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Инициализируем SDK YooKassa один раз на уровне модуля.
// Это быстрее и чище, чем создавать новый клиент в каждом запросе.
const yookassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});

const ensureYooKassaCredentials = () => {
  if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
    throw new AppError(
      500,
      'YooKassa credentials are missing. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.'
    );
  }
};

// Создает запись Booking на основании подтвержденного платежа.
// ВАЖНО: функция идемпотентна за счет проверки yookassaPaymentId.
const createBookingFromPaidYooKassaPayment = async payment => {
  // Без ID платежа или метаданных мы не можем надежно связать платеж с туром/пользователем.
  if (!payment?.id || !payment?.metadata) return null;

  const { tourId, userId } = payment.metadata;
  const amountValue = Number(payment?.amount?.value);

  // Базовая валидация входящих данных от webhook.
  if (!tourId || !userId || !Number.isFinite(amountValue)) return null;

  // Если такой платеж уже обработан, возвращаем найденную бронь и не создаем дубль.
  const existingBooking = await Booking.findOne({
    yookassaPaymentId: payment.id
  });
  if (existingBooking) return existingBooking;

  // Создаем бронь только по факту подтвержденной оплаты.
  return Booking.create({
    tour: tourId,
    user: userId,
    price: amountValue,
    paid: true,
    status: 'paid',
    yookassaPaymentId: payment.id
  });
};

// Получает платеж из YooKassa и создает Booking, если он оплачен.
// expectedUserId нужен для fallback-режима без webhook:
// подтверждаем оплату только для текущего авторизованного пользователя.
const confirmPaymentAndCreateBooking = async (paymentId, expectedUserId = null) => {
  if (!paymentId) return null;

  ensureYooKassaCredentials();

  const payment = await yookassa.getPayment(paymentId);
  if (!payment || payment.status !== 'succeeded') return null;

  const metadataUserId = payment?.metadata?.userId
    ? String(payment.metadata.userId)
    : null;
  if (expectedUserId && metadataUserId !== String(expectedUserId)) return null;

  return createBookingFromPaidYooKassaPayment(payment);
};

const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Получаем текущий тур.
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError(404, 'No tour found with that ID'));
  }

  // 2) Проверяем, что ключи YooKassa действительно загружены.
  // Иначе сразу даем понятную серверную ошибку, а не "падение где-то внутри SDK".
  ensureYooKassaCredentials();

  // 3) Строим URL, на которые вернем пользователя после оплаты/отмены.
  // return_url - это "куда вернуться после платежной страницы".
  // Он НЕ подтверждает оплату: факт оплаты фиксируем только webhook'ом.
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const successUrl = `${baseUrl}/my-tours?payment=success`;
  const cancelUrl = `${baseUrl}/tour/${tour.slug}`;

  // 4) Создаем платеж в YooKassa.
  // Идемпотентный ключ обязателен для безопасных повторов запросов.
  // Если клиент повторно отправит тот же запрос, платеж не продублируется.
  const payment = await yookassa.createPayment(
    {
      amount: {
        value: Number(tour.price).toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: successUrl
      },
      // capture: true => деньги спишутся автоматически после успешной авторизации.
      // Для учебного проекта это самый простой и удобный вариант.
      capture: true,
      description: `${tour.name} Tour`,
      // metadata возвращается в webhook-событиях.
      // Через нее мы связываем оплату с туром и пользователем БЕЗ query-параметров в URL.
      metadata: {
        tourId: req.params.tourId,
        userId: String(req.user.id),
        customerEmail: req.user.email,
        cancelUrl
      }
    },
    crypto.randomUUID()
  );

  // 5) Отправляем клиенту только то, что нужно для редиректа.
  res.status(200).json({
    status: 'success',
    session: {
      id: payment.id,
      status: payment.status,
      confirmation_url: payment.confirmation?.confirmation_url
    }
  });
});

// Вебхук YooKassa: сюда YooKassa присылает события об изменении статуса платежа.
// Здесь мы фиксируем реальный результат оплаты и создаем Booking.
const yookassaWebhook = catchAsync(async (req, res, next) => {
  // Дополнительная защита:
  // если вы проксируете webhook через свой шлюз (ngrok/cloudflare worker/Nginx),
  // можно передавать секрет в заголовке x-yookassa-webhook-secret.
  const receivedSecret = req.get('x-yookassa-webhook-secret');
  if (
    process.env.YOOKASSA_WEBHOOK_SECRET &&
    receivedSecret &&
    receivedSecret !== process.env.YOOKASSA_WEBHOOK_SECRET
  ) {
    return next(new AppError(401, 'Invalid YooKassa webhook secret.'));
  }

  // Ожидаем формат уведомления:
  // { type: 'notification', event: 'payment.succeeded', object: { ...payment } }
  const event = req.body?.event;
  const payment = req.body?.object;
  if (!event || !payment) {
    return next(new AppError(400, 'Invalid YooKassa webhook payload.'));
  }

  // Создаем бронь только при успешной оплате.
  if (event === 'payment.succeeded') {
    await createBookingFromPaidYooKassaPayment(payment);
  }

  // Для всех остальных событий просто подтверждаем получение 200.
  // Иначе YooKassa будет повторно слать webhook.
  res.status(200).json({ status: 'success' });
});

// Fallback без webhook:
// клиент передает paymentId после возврата с платежной страницы,
// сервер запрашивает статус платежа в YooKassa и при статусе succeeded
// создает Booking идемпотентно.
const confirmPayment = catchAsync(async (req, res, next) => {
  const paymentId = String(req.params.paymentId || '').trim();
  if (!paymentId) {
    return next(new AppError(400, 'Payment ID is required.'));
  }

  const booking = await confirmPaymentAndCreateBooking(paymentId, req.user.id);

  res.status(200).json({
    status: 'success',
    bookingCreated: Boolean(booking),
    data: {
      booking: booking || null
    }
  });
});

module.exports = {
  getCheckoutSession,
  yookassaWebhook,
  confirmPaymentAndCreateBooking,
  confirmPayment
};
