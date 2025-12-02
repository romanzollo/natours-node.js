const { Model } = require('mongoose');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// --- ФАБРИЧНЫЕ ФУНКЦИИ --- //
exports.getAll = (Model, customFilter = {}) =>
  catchAsync(async (req, res, next) => {
    // Источник пользовательских фильтров: безопасная копия, если есть, иначе req.query (только чтение)
    const docQuery = req.safeQuery || req.query;

    // Базовый фильтр по умолчанию пустой
    let baseFilter = {};

    // Применяем фильтр secretTour только к модели 'Tour'
    // Публично скрываем секретные, привилегированные роли видят все
    if (Model.modelName === 'Tour' && !req.canSeeSecretTours) {
      baseFilter = { secretTour: false };
    }

    // customFilter может быть объектом или функцией
    const filterFromCustom =
      typeof customFilter === 'function' ? customFilter(req) : customFilter;

    // To allow nested GET reviews on tour
    // Объединяем базовый фильтр и кастомный фильтр из контроллера
    const filter = {
      ...baseFilter,
      ...filterFromCustom // если есть tourId в params
    };

    // --- ВЫПОЛНЯЕМ ЗАПРОС --- //
    const features = new APIFeatures(
      Model.find(filter),
      docQuery,
      req.aliasQuery // сюда подаём "виртуальные" параметры
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // валидация страницы теперь тут
    await features.validatePage(Model);

    // const documents = await features.query.explain(); // для теста индексов
    const documents = await features.query;

    // --- ОТПРАВЛЯЕМ ОТВЕТ --- //
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents }
    });
  });

// получить конкретный документ
exports.getOne = (Model, populateOpts) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); // поиск по id
    if (populateOpts) query = query.populate(populateOpts); // добавление вложенных документов
    const document = await query; // получение документа

    // если тур не нашелся пробрасываем ошибку в глобальный обработчик ошибок
    if (!document) {
      return next(new AppError(404, 'No document found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: { data: document }
    });
  });

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
      data: { data: document }
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
