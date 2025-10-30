// controllers/userAdminController.js
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Разрешённые значения роли должны соответствовать enum в схеме
const ALLOWED_ROLES = ['user', 'guide', 'lead-guide', 'admin'];

exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  // Жёсткая валидация входа
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return next(new AppError(400, 'Invalid or missing role value'));
  }

  // Обновляем только поле role
  const updated = await User.findByIdAndUpdate(
    id,
    { role },
    {
      new: true, // вернуть обновлённый документ
      runValidators: true, // прогнать валидаторы схемы
      context: 'query' // корректная работа некоторых валидаторов
    }
  ).select('-__v -password');

  if (!updated) {
    return next(new AppError(404, 'User not found'));
  }

  res.status(200).json({
    status: 'success',
    data: { user: updated }
  });
});
