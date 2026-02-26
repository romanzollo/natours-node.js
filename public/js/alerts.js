const ALERT_SHOW_TIME = 5000;

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (!el) return;

  el.classList.add('alert--hide');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
};

// type: 'success' | 'error'
export const showAlert = (type = 'success', message = '') => {
  if (!message) return; // не показываем пустые/undefined сообщения

  hideAlert();

  const el = document.createElement('div');
  el.className = `alert alert--${type}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;

  document.body.appendChild(el);

  window.setTimeout(hideAlert, ALERT_SHOW_TIME);
};
