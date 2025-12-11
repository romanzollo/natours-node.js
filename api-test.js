const url = 'https://statistic-experiments.onrender.com/';

fetch(url)
  .then(res => {
    console.log('Статус:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log('Данные:', data);
  })
  .catch(err => {
    console.error('Ошибка:', err.message);
  });
