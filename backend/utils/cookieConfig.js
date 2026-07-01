const parseExpiresIn = (expiresIn) => {
  const match = String(expiresIn).trim().match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 30 * 60 * 1000;
  }
};

const getTokenCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  path: '/',
  maxAge: parseExpiresIn(process.env.JWT_EXPIRES_IN || '30m')
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  path: '/'
});

module.exports = {
  parseExpiresIn,
  getTokenCookieOptions,
  getClearCookieOptions
};
