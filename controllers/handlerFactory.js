const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Model } = require('mongoose');

// --- ФАБРИЧНЫЕ ФУНКЦИИ --- //
// удалить конкретный документ
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    // если тур не нашелся пробрасываем ошибку в глобальный обработчик ошибок
    if (!document) {
      return next(new AppError(404, 'No document found with that ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

// обновить конкретный документ
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // вернуть обновлённый документ
      runValidators: true // запускать валидацию схемы
    });

    // если тур не нашелся пробрасываем ошибку в глобальный обработчик ошибок
    if (!document) {
      return next(new AppError(404, 'No document found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: { document }
    });
  });

// создать новый документ
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: document }
    });
  });
