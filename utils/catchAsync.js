// перехватываем ошибки в асинхронных функциях
// чтобы избавиться в дальнейшем от try-catch
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
