const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/* фабричные функции для контроллеров */
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
