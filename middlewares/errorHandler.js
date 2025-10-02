module.exports = (err, req, res, next) => {
  const code = Number.isInteger(err.statusCode) ? err.statusCode : 500; // проверяем, является ли statusCode целым числом
  const status =
    err.status || (String(code).startsWith('4') ? 'fail' : 'error'); // проверяем, является ли status fail

  res
    .status(code)
    .json({ status, message: err.message || 'Internal Server Error' });
};
