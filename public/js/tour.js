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
  const bookBtn = document.getElementById('book-tour');
  if (bookBtn) {
    bookBtn.addEventListener('click', async e => {
      e.preventDefault();

      const tourId = bookBtn.dataset.tourId;
      const initialText = bookBtn.textContent;

      bookBtn.disabled = true;
      bookBtn.textContent = 'Processing...';

      try {
        const res = await axios.post(`/api/v1/bookings/checkout-session/${tourId}`);
        const confirmationUrl = res.data?.session?.confirmation_url;

        if (!confirmationUrl) {
          throw new Error('YooKassa confirmation URL was not returned by API.');
        }

        // Сохраняем id платежа для fallback-сценария без webhook:
        // после возврата на /my-tours фронт сможет попросить сервер
        // подтвердить оплату напрямую через API YooKassa.
        if (res.data?.session?.id) {
          localStorage.setItem('pendingYooKassaPaymentId', res.data.session.id);
        }

        window.location.assign(confirmationUrl);
      } catch (err) {
        showAlert(
          'error',
          err.response?.data?.message ||
            err.message ||
            'Could not start payment. Please try again.'
        );
        bookBtn.disabled = false;
        bookBtn.textContent = initialText;
      }
    });
  }
});

// console.log('Tour bundle loaded');
