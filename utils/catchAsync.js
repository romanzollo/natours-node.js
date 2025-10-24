// перехватываем ошибки в асинхронных функциях
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
