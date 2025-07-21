const fs = require('fs');

// Синхронно читаем JSON-файл с данными о турах и преобразуем его в JavaScript-объект
// __dirname — путь к текущей директории, чтобы правильно указать путь к файлу
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// --- middleware для проверки наличия ID тура --- //
const checkID = (req, res, next, value) => {
  console.log(`Tour id is: ${value}`);

  // проверяем на наличие тура
  if (Number(req.params.id) > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  next();
};

// Middleware для проверки наличия обязательных полей в теле запроса
// Применяется только к POST-запросу при создании тура
const checkBody = (req, res, next) => {
  const { name, price } = req.body;

  // Проверяем, есть ли name и price в теле запроса
  if (!name || !price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Request must contain "name" and "price"',
    });
  }

  // Если всё в порядке — передаём управление дальше
  next();
};

// --- получить все туры --- //
const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

// --- получить конкретный тур --- //
const getTour = (req, res) => {
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
};

// --- создать новый тур --- //
const createTour = (req, res) => {
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
};

// --- обновить конкретный тур --- //
const updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

// --- удалить конкретный тур --- //
const deleteTour = (req, res) => {
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
};

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  checkID,
  checkBody,
};
