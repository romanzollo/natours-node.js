import axios from 'axios';
import { showAlert } from './alerts.js';

const ENDPOINTS = {
  data: '/api/v1/users/update-me',
  password: '/api/v1/users/update-my-password'
};

export const updateSettings = async (data, type) => {
  try {
    const res = await axios.patch(ENDPOINTS[type], data);

    if (res.data.status === 'success') {
      const label = type === 'password' ? 'Password' : 'Profile';
      showAlert('success', `${label} updated successfully!`);
      return true;
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Something went wrong');
  }
  return false;
};
