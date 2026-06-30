const AppError = require('../utils/appError');

const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by protect middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = { restrictTo };
