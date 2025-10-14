const mongoose = require('mongoose'); // Импортируем библиотеку mongoose
const validator = require('validator'); // библиотека для кастомных валидаций
const bcrypt = require('bcryptjs'); // библиотека для хеширования паролей

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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'A user password must have more or equal then 8 characters']
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
  }
});

// --- MONGOOSE MIDDLEWARES --- //
// middleware документа: срабатывает перед сохранением и созданием (только .save() и .create())
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12); // хешируем пароль
  this.passwordConfirm = undefined; // удаляем поле passwordConfirm

  next();
});

// Создаем модель
const User = mongoose.model('User', userSchema); // mongoose автоматически преобразует имя 'User' в нижний регистр и множественное число: коллекция в MongoDB будет называться users

module.exports = User;
