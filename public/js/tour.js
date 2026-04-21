import { displayMap } from './map.js';
import axios from 'axios';
import { showAlert } from './alerts.js';

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    displayMap();
  }

  // Кнопка покупки тура:
  // 1) просим бэкенд создать платеж в YooKassa,
  // 2) получаем confirmation_url,
  // 3) переводим пользователя на платежную страницу YooKassa.
  const bookBtn = document.getElementById('book-tour'); // получаем кнопку покупки тура
  if (bookBtn) {
    // если кнопка найдена, добавляем обработчик клика
    bookBtn.addEventListener('click', async e => {
      e.preventDefault();

      const tourId = bookBtn.dataset.tourId; // получаем id тура из data-атрибута (tour.id из pug шаблона становится tourId согласно camelCase)
      const initialText = bookBtn.textContent; // сохраняем исходный текст кнопки

      bookBtn.disabled = true; // блокируем кнопку
      bookBtn.textContent = 'Processing...'; // меняем текст на "Processing..."

      try {
        const res = await axios.post(
          `/api/v1/bookings/checkout-session/${tourId}`
        ); // отправляем запрос на создание платежа
        const confirmationUrl = res.data?.session?.confirmation_url; // получаем confirmation_url из ответа

        if (!confirmationUrl) {
          throw new Error('YooKassa confirmation URL was not returned by API.'); // если confirmation_url не получен, выбрасываем ошибку
        }

        // Сохраняем id платежа для fallback-сценария без webhook:
        // после возврата на /my-tours фронт сможет попросить сервер
        // подтвердить оплату напрямую через API YooKassa.
        if (res.data?.session?.id) {
          // если id платежа получен, сохраняем его в localStorage
          localStorage.setItem('pendingYooKassaPaymentId', res.data.session.id); // сохраняем id платежа в localStorage
        }

        window.location.assign(confirmationUrl); // переходим на платежную страницу YooKassa
      } catch (err) {
        showAlert(
          'error',
          err.response?.data?.message ||
            err.message ||
            'Could not start payment. Please try again.'
        );

        bookBtn.disabled = false; // разблокируем кнопку
        bookBtn.textContent = initialText; // возвращаем исходный текст кнопки
      }
    });
  }
});
