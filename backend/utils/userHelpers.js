const AppError = require('./appError');

const excludePassword = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

const preventSelfAction = (targetUserId, actorId, actionName) => {
  if (targetUserId.toString() === actorId.toString()) {
    throw new AppError(`You cannot ${actionName}.`, 400);
  }
};

module.exports = {
  excludePassword,
  preventSelfAction
};
