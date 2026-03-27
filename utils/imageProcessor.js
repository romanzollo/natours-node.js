const sharp = require('sharp'); // для обработки и ресайза изображений
const path = require('path');
const fs = require('fs').promises;

/**
 * Пресеты для разных типов изображений
 */
const PRESETS = {
  tour: {
    width: 2000,
    height: 1333,
    quality: 90,
    format: 'jpeg',
    basePath: path.join(__dirname, '..', 'public', 'img', 'tours')
  },
  user: {
    width: 500,
    height: 500,
    quality: 90,
    format: 'jpeg',
    basePath: path.join(__dirname, '..', 'public', 'img', 'users')
  }
};

/**
 * Обрабатывает изображение: ресайз, конвертация, сжатие и сохранение
 * @param {Buffer} buffer - буфер изображения из multer
 * @param {string} filename - имя файла для сохранения
 * @param {string|Object} preset - имя пресета ('tour' | 'user') или кастомные настройки
 * @returns {Promise<string>} - имя сохранённого файла
 */
const processImage = async (buffer, filename, preset = 'tour') => {
  // Если передано строковое имя пресета — берём настройки из PRESETS
  const options =
    typeof preset === 'string'
      ? PRESETS[preset]
      : { ...PRESETS.tour, ...preset }; // или кастомные настройки

  if (!options) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  // Создаём пайплайн sharp
  let pipeline = sharp(buffer).resize(options.width, options.height);

  // Применяем формат и качество
  if (options.format === 'jpeg') {
    pipeline = pipeline.toFormat('jpeg').jpeg({ quality: options.quality });
  } else if (options.format === 'webp') {
    pipeline = pipeline.toFormat('webp').webp({ quality: options.quality });
  } else if (options.format === 'png') {
    pipeline = pipeline.toFormat('png').png({ quality: options.quality });
  }

  // Гарантируем существование директории
  await fs.mkdir(options.basePath, { recursive: true });

  // Сохраняем файл
  const fullPath = path.join(options.basePath, filename);
  await pipeline.toFile(fullPath);

  return filename;
};

/**
 * Утилита: генерирует уникальное имя файла
 * @param {string} prefix - префикс имени (например, 'user', 'tour')
 * @param {string} id - ID сущности
 * @param {string} suffix - суффикс (например, 'cover', '1', '')
 * @returns {string} - имя файла
 */
const generateFilename = (prefix, id, suffix = '') => {
  const ext = 'jpeg';
  return suffix
    ? `${prefix}-${id}-${Date.now()}-${suffix}.${ext}`
    : `${prefix}-${id}-${Date.now()}.${ext}`;
};

module.exports = {
  processImage,
  generateFilename,
  PRESETS
};
