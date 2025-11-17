module.exports = (req, res, next) => {
  // Admin/lead-guide видят секретные туры
  const role = req.user ? String(req.user.role || '').toLowerCase() : '';
  req.canSeeSecretTours = role === 'admin' || role === 'lead-guide';
  next();
};
