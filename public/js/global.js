import 'core-js/stable'; // подключаем Polyfill для старых браузеров
// import 'regenerator-runtime/runtime'; // Раскомментировать, если нужно использовать async/await в старых браузерах

// Явный импорт и вызов — зависимости видны!
import { initLogin, logout } from './login.js';

document.addEventListener('DOMContentLoaded', () => {
  initLogin();

  const logoutBtn = document.querySelector('.nav__el--logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async e => {
      e.preventDefault();
      await logout();
    });
  }
});

// console.log('Global bundle loaded!');
