const extractTokenFromRequest = (req) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  return token || null;
};

module.exports = {
  extractTokenFromRequest
};
