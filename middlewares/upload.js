const multer = require('multer');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { processImage, generateFilename } = require('../utils/imageProcessor');

/**
 * В этом файле живут middleware для загрузки и обработки изображений.
 *
 * Зачем отдельный файл:
 * - контроллеры остаются «тонкими» и занимаются бизнес-логикой, а не деталями файловой загрузки
 * - одна и та же логика обработки (sharp + ресайз + сохранение) переиспользуется через `utils/imageProcessor.js`
 * - роуты читаются проще: upload -> resize -> controller
 */

// ===============================
// MULTER CONFIGURATION
// ===============================

/**
 * Мы используем memoryStorage (буфер), потому что:
 * - хотим прогнать картинку через sharp (ресайз/сжатие) ДО сохранения на диск
 * - не хотим сохранять «сырой» оригинал, чтобы потом удалять/перезаписывать
 */
const multerStorage = multer.memoryStorage();

/**
 * Принимаем только изображения по mimetype.
 * Важно: `file.mimetype` приходит от клиента, но для учебного проекта этого достаточно.
 * В проде часто добавляют доп. проверку сигнатуры файла (magic bytes).
 */
const multerFilter = (req, file, cb) => {
  if (file.mimetype?.startsWith('image')) return cb(null, true);

  // Ошибка будет поймана глобальным error handler'ом как operational error (AppError)
  return cb(new AppError(400, 'Not an image! Please upload only images.'), false);
};

/**
 * Ограничиваем размер файла (5MB), чтобы не получать OOM и не хранить огромные буферы в памяти.
 */
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ===============================
// TOURS: upload + resize
// ===============================

/**
 * Для тура ожидаем:
 * - `imageCover` (1 файл)
 * - `images` (до 3 файлов)
 *
 * После upload'а multer положит данные в:
 * - req.files.imageCover = [ { buffer, mimetype, ... } ]
 * - req.files.images = [ { buffer, ... }, ... ]
 */
const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

/**
 * Прогоняем картинки тура через `processImage` и записываем имена файлов в `req.body`.
 * Это важно: `updateTour` дальше просто делает update по `req.body`, а поля `imageCover/images`
 * уже будут содержать готовые имена файлов (которые реально сохранены на диск).
 *
 * Обрабатываем cover и images независимо:
 * - можно обновлять только cover
 * - можно обновлять только images
 * - можно обновлять и то и другое
 */
const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files?.imageCover && !req.files?.images) return next();

  const { id } = req.params;

  if (req.files.imageCover?.[0]) {
    req.body.imageCover = await processImage(
      req.files.imageCover[0].buffer,
      generateFilename('tour', id, 'cover'),
      'tour'
    );
  }

  if (req.files.images?.length) {
    req.body.images = await Promise.all(
      req.files.images.map((file, i) =>
        processImage(
          file.buffer,
          generateFilename('tour', id, String(i + 1)),
          'tour'
        )
      )
    );
  }

  next();
});

module.exports = { uploadTourImages, resizeTourImages };
