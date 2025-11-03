const mongoose = require('mongoose'); // Импортируем библиотеку mongoose
const validator = require('validator'); // библиотека для кастомных валидаций
const bcrypt = require('bcryptjs'); // библиотека для хеширования паролей

const crypto = require('crypto'); // встроенная библиотека для генерации хешей

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
    trim: true, // автоматически удаляет пробелы в начале и конце строки
    maxlength: [15, 'A user name must have less or equal then 15 characters'],
    minlength: [3, 'A user name must have more or equal then 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'lead-guide', 'guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'A user password must have more or equal then 8 characters'],
    select: false // false - поле не будет возвращаться в ответе (чтобы не показывать пароли пользователя)
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // валидатор сработает только при SAVE и CREATE => User.Create(), User.Save() (при UPDATE уже работать не будет)!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
});

// --- MONGOOSE MIDDLEWARES --- //
// middleware документа: срабатывает перед сохранением и созданием (только .save() и .create())
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  // Хеш пароля
  this.password = await bcrypt.hash(this.password, 12); // хешируем пароль
  this.passwordConfirm = undefined; // удаляем поле passwordConfirm

  // записываем время изменения пароля
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // минус 1с для iat
  }

  next();
});

// --- МЕТОДЫ MONGOOSE --- //
// проверка совпадения пароля
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// проверка изменения пароля
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (!this.passwordChangedAt) return false;

  // переводим дату в секунды
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  console.log(changedTimestamp, JWTTimestamp);

  // true - если пароль был изменен, false - если пароль не был изменен
  return JWTTimestamp < changedTimestamp;
};

// создание токена для сброса пароля
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // сохраняем токен в базе данных
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //   console.log({ resetToken }, this.passwordResetToken);

  // устанавливаем время жизни токена
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 минут

  return resetToken;
};

// удаляем поля password и __v
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});
userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// Создаем модель
const User = mongoose.model('User', userSchema); // mongoose автоматически преобразует имя 'User' в нижний регистр и множественное число: коллекция в MongoDB будет называться users

module.exports = User;
