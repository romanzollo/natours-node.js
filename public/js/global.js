import 'core-js/stable'; // подключаем Polyfill для старых браузеров
// import 'regenerator-runtime/runtime'; // Раскомментировать, если нужно использовать async/await в старых браузерах

// Явный импорт и вызов — зависимости видны!
import { initLogin } from './login.js';

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
});

// console.log('Global bundle loaded!');
