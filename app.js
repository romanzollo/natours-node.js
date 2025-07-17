const fs = require('fs');
const express = require('express');

const app = express();

// этот middleware позволяет работать с JSON в теле запросов
app.use(express.json());

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// --- получить все туры --- //
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

// --- получить конкретный тур --- //
app.get('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1; // * 1 — чтобы преобразовать строку в число
  const tour = tours.find((el) => el.id === id);

  // проверяем на наличие тура
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// --- обновить конкретный тур --- //
app.patch('/api/v1/tours/:id', (req, res) => {
  // проверяем на наличие тура
  if (Number(req.params.id) > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
});

// --- удалить конкретный тур --- //
app.delete('/api/v1/tours/:id', (req, res) => {
  // проверяем на наличие тура
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// --- создать новый тур --- //
app.post('/api/v1/tours', (req, res) => {
  // req.body — здесь будут данные из JSON

  const newId = tours[tours.length - 1].id + 1;
  const newTour = { ...req.body, id: newId };
  //   const newTour = Object.assign({}, req.body, { id: newId }); -  альтернативный вариант

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tours: newTour,
        },
      });
    }
  );
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
