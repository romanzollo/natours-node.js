const fs = require('fs');
const mongoose = require('mongoose');
const TourModel = require('../../models/tourModel');

require('dotenv').config();

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

/**
 * Асинхронная функция для подключения к базе данных MongoDB
 * Использует библиотеку Mongoose для установления соединения
 */
async function connectDB() {
  try {
    await mongoose.connect(DB);
    console.log('DB connection successful!');
  } catch (error) {
    console.error('DB connection error:', error);
  }
}
connectDB();

// ЧТЕНИЕ ФАЙЛА
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// ИМПОРТ ДАННЫХ В БД
const importData = async () => {
  try {
    await TourModel.create(tours);
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// УДАЛЕНИЕ ДАННЫХ В БД
const deleteData = async () => {
  try {
    await TourModel.deleteMany();
    console.log('Data successfully deleted!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
