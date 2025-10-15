const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

const singup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
});

module.exports = {
  singup
};
