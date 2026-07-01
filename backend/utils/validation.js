const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const VALID_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'];

const isValidPassword = (password) => PASSWORD_REGEX.test(password);

const isValidEmail = (email) => EMAIL_REGEX.test(email);

const isValidRole = (role) => VALID_ROLES.includes(role);

module.exports = {
  PASSWORD_REGEX,
  EMAIL_REGEX,
  VALID_ROLES,
  isValidPassword,
  isValidEmail,
  isValidRole
};
