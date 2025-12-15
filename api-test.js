// const url = 'https://statistic-experiments.onrender.com/';

// fetch(url)
//   .then(res => {
//     console.log('Статус:', res.status);
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     return res.json();
//   })
//   .then(data => {
//     console.log('Данные:', data);
//   })
//   .catch(err => {
//     console.error('Ошибка:', err.message);
//   });

const url = 'https://statistic-experiments.onrender.com/monty_hall/simulate';

const payload = {
  status: 'Good',
  base_data: {
    doors: 10,
    prize: 1,
    close_doors: 1
  },
  rules: 'some rules'
};

async function sendPost() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Статус:', res.status);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Ответ сервера:', data);
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

sendPost();
