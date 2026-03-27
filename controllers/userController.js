const multer = require('multer'); // для загрузки пользовательских img
const fs = require('fs');
const path = require('path');

const User = require('../models/userModel'); // импортируем модель
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory'); // импортируем фабричный контроллер для CRUD операций
const { processImage, generateFilename } = require('../utils/imageProcessor');

// --- создаем middleware multer --- //
// определяем и настраиваем хранилище файлов
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   // формируем название
//   filename: (req, file, cb) => {
//     // user-id-time (leo-3253252dgc33w3wc-32525325325325325.jpeg)
//     const ext = file.mimetype.split('/')[1]; // достаем расширения файла
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
// ==========================================
// MULTER CONFIGURATION
// ==========================================
const multerStorage = multer.memoryStorage(); // Храним в буфере для обработки в sharp

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

const uploadUserPhoto = upload.single('photo');

// создаем middleware для формирования изображения юзера с нужными нам параметрами
const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = await processImage(
    req.file.buffer,
    generateFilename('user', req.user.id),
    'user'
  );

  next();
});

// Функция для фильтрации ненужных полей
const filterObj = (obj, ...allowed) => {
  const out = {};
  for (const key of Object.keys(obj)) {
    if (allowed.includes(key)) out[key] = obj[key];
  }

  return out;
};

// --- Обновить свой профиль --- //
const updateMe = catchAsync(async (req, res, next) => {
  // Позволяем менять только эти поля
  const ALLOWED_FIELDS = ['name', 'email'];

  // Эти фото создаем через API и безопасны для удаления при смене аватара.
  // seed-файлы вроде `default.jpg` и `user-1.jpg ... user-20.jpg` не подпадают под этот паттерн.
  const isApiGeneratedPhoto = filename =>
    typeof filename === 'string' &&
    // user-<mongodbObjectId>-<timestamp>.jpeg
    /^user-[0-9a-f]{24}-\d+\.jpeg$/i.test(filename);

  // 1) Запрет смены пароля на этом роуте
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(400, 'Use /update-my-password for password changes.')
    );
  }

  // 2) Жёсткая фильтрация входных полей
  const data = filterObj(req.body, ...ALLOWED_FIELDS); // { name, email }
  let previousPhoto;
  if (req.file) {
    const previousUser = await User.findById(req.user.id).select('photo');
    previousPhoto = previousUser?.photo;
    data.photo = req.file.filename; // добавляем photo, если есть файл
  }

  // 3) Если email меняется — можно пометить как неподтверждённый/завести pendingEmail и отправить письмо
  //    Пример: if (data.email) { data.pendingEmail = data.email; delete data.email; /* send verify */ }

  // 4) Обновление с валидацией, сеттерами и безопасными опциями
  const updatedUser = await User.findByIdAndUpdate(req.user.id, data, {
    new: true, // вернуть обновлённый документ
    runValidators: true, // включить валидаторы апдейта
    context: 'query', // корректный контекст для валидаторов
    runSettersOnQuery: true // применить сеттеры на апдейте (важно для trim/lowercase)
  }).select('+id'); // пароля тут и так не будет, но следим, чтобы он не утёк

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });

  // 5) Удаляем старый файл только если он создан через API и отличается от нового.
  // Операция не должна влиять на ответ пользователю — ошибки подавляем.
  if (
    req.file &&
    previousPhoto &&
    isApiGeneratedPhoto(previousPhoto) &&
    previousPhoto !== req.file.filename
  ) {
    const oldPhotoPath = path.join(
      __dirname,
      '..',
      'public',
      'img',
      'users',
      previousPhoto
    );

    try {
      await fs.promises.unlink(oldPhotoPath);
    } catch (err) {
      // Не ломаем запрос, если файла нет/не удалился
    }
  }
});

// --- Удалить свой профиль --- //
const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

// --- Получить свой профиль --- //
const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = factory.getAll(User); // Получить всех пользователей
const getUser = factory.getOne(User); // Получить конкретного пользователя
const updateUser = factory.updateOne(User); // Обновить пользователя (не обновлять пароль таким образом)
const deleteUser = factory.deleteOne(User); // Удалить пользователя из БД (администратором)

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
};
