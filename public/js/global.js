import 'core-js/stable'; // подключаем Polyfill для старых браузеров
// import 'regenerator-runtime/runtime'; // Раскомментировать, если нужно использовать async/await в старых браузерах

// Явный импорт и вызов — зависимости видны!
import { initLogin, logout } from './login.js';
import { updateSettings } from './updateSettings.js';

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  // определяем элементы
  const logoutBtn = document.querySelector('.nav__el--logout');
  const formUserData = document.querySelector('.form-user-data');

  // добавляем обработчики событий
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
    });
  }
  if (formUserData) {
    formUserData.addEventListener('submit', async e => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;

      await updateSettings(name, email);
    });
  }
});

// console.log('Global bundle loaded!');
