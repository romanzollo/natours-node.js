import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', { email, password });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      setTimeout(() => (location.href = '/'), 1500);
      return true;
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Login failed');
  }
  return false;
};

export const initLogin = () => {
  const form = document.querySelector('.form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (email && password) {
      const success = await login(email, password);
      if (success) form.reset(); // Очищаем форму после входа
    }
  });
};

export const logout = async () => {
  try {
    const res = await axios.get('/api/v1/users/logout');
    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch {
    showAlert('error', 'Error logging out! Try again.');
  }
};
