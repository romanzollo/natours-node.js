import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: { email, password }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => location.assign('/'), 1500);
      return true;
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Something went wrong');
    console.log(err);
    return false;
  }
};

// Инициализация вынесена отдельно — вызывается явно
export const initLogin = () => {
  const form = document.querySelector('.form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (email && password) await login(email, password);
  });
};

// Авто-инициализация только если модуль загружен в нужном контексте
// (опционально, можно убрать для полного контроля)
if (document.querySelector('.form')) {
  initLogin();
}
