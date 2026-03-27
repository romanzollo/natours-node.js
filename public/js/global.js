import 'core-js/stable';
import { initLogin, logout } from './login.js';
import { updateSettings } from './updateSettings.js';
import { showAlert } from './alerts.js';

// Хелпер: безопасное изменение состояния кнопки
const setButtonLoading = (btn, loading, originalText) => {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Updating...' : originalText;
};

document.addEventListener('DOMContentLoaded', () => {
  initLogin();

  // Logout
  document
    .querySelector('.nav__el--logout')
    ?.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
    });

  //-- Форма профиля --//
  const formUserData = document.querySelector('.form-user-data');
  if (formUserData) {
    formUserData.addEventListener('submit', async e => {
      e.preventDefault();

      // Ищем кнопку: по type или по классу .btn
      const btn =
        formUserData.querySelector('button[type="submit"]') ||
        formUserData.querySelector('.btn');
      const originalText = btn ? btn.textContent.trim() : 'Save settings';
      let shouldRestoreButton = true; // для перезагрузки при изменении данных

      setButtonLoading(btn, true, originalText);

      try {
        // создаём FormData из формы
        const formData = new FormData(formUserData);

        // для перезагрузки при изменении данных
        const ok = await updateSettings(formData, 'data');
        if (ok) {
          if (btn) btn.textContent = 'Saved!';
          shouldRestoreButton = false;
          // Небольшая пауза: пользователь видит успешный статус,
          // после чего страница перезагружается с уже актуальными данными.
          window.setTimeout(() => location.reload(), 900);
        }
        // форму с именем и email не сбрасуем — поля остаются с новыми данными
      } finally {
        if (shouldRestoreButton) setButtonLoading(btn, false, originalText);
      }
    });
  }

  //-- Форма пароля --//
  const userPasswordForm = document.querySelector('.form-user-password');
  if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
      e.preventDefault();

      const btn =
        userPasswordForm.querySelector('button[type="submit"]') ||
        userPasswordForm.querySelector('.btn');
      const originalText = btn ? btn.textContent.trim() : 'Save password';

      setButtonLoading(btn, true, originalText);

      try {
        const passwordCurrent = document.getElementById('password-current')
          ?.value;
        const password = document.getElementById('password')?.value;
        const passwordConfirm = document.getElementById('password-confirm')
          ?.value;

        if (password !== passwordConfirm) {
          showAlert('error', 'New passwords do not match!');
          return;
        }

        await updateSettings(
          { passwordCurrent, password, passwordConfirm },
          'password'
        );

        // Сбрасываем ТОЛЬКО форму пароля
        userPasswordForm.reset();
      } finally {
        setButtonLoading(btn, false, originalText);
      }
    });
  }
});
