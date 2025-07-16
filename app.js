const express = require('express');

const app = express();

const port = 3000;

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hi from the server!', app: 'natours' });
});

app.post('/', (req, res) => {
  console.log('You can post to this endpoint...');
});

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
