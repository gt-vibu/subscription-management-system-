const { validateRegister, validateLogin, validateVerifyEmail, validateResendOtp } = require('../../validators/authValidator');
const AppError = require('../../utils/appError');

const createReq = (body) => ({ body });
const res = {};
const next = jest.fn();

beforeEach(() => {
  next.mockClear();
});

describe('authValidator', () => {
  describe('validateRegister', () => {
    it('should call next() with no error for valid input', () => {
      const req = createReq({ name: 'John', email: 'john@example.com', password: 'Password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when name is missing', () => {
      const req = createReq({ email: 'john@example.com', password: 'Password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Name is required.');
    });

    it('should return error when name is empty string', () => {
      const req = createReq({ name: '   ', email: 'john@example.com', password: 'Password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Name is required.');
    });

    it('should return error when email is missing', () => {
      const req = createReq({ name: 'John', password: 'Password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Email is required.');
    });

    it('should return error for invalid email format', () => {
      const req = createReq({ name: 'John', email: 'invalid-email', password: 'Password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Please provide a valid email address.');
    });

    it('should return error when password is missing', () => {
      const req = createReq({ name: 'John', email: 'john@example.com' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Password is required.');
    });

    it('should return error for weak password (no uppercase)', () => {
      const req = createReq({ name: 'John', email: 'john@example.com', password: 'password1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should return error for weak password (no digit)', () => {
      const req = createReq({ name: 'John', email: 'john@example.com', password: 'Password!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error for weak password (no special char)', () => {
      const req = createReq({ name: 'John', email: 'john@example.com', password: 'Password1' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error for short password', () => {
      const req = createReq({ name: 'John', email: 'john@example.com', password: 'Pa1!' });
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validateLogin', () => {
    it('should call next() with no error for valid input', () => {
      const req = createReq({ email: 'john@example.com', password: 'password' });
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when email is missing', () => {
      const req = createReq({ password: 'password' });
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Email is required.');
    });

    it('should return error when password is missing', () => {
      const req = createReq({ email: 'john@example.com' });
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Password is required.');
    });
  });

  describe('validateVerifyEmail', () => {
    it('should call next() with no error for valid input', () => {
      const req = createReq({ email: 'john@example.com', otp: '123456' });
      validateVerifyEmail(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when email is missing', () => {
      const req = createReq({ otp: '123456' });
      validateVerifyEmail(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Email is required.');
    });

    it('should return error for invalid email', () => {
      const req = createReq({ email: 'bad-email', otp: '123456' });
      validateVerifyEmail(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Please provide a valid email address.');
    });

    it('should return error when otp is missing', () => {
      const req = createReq({ email: 'john@example.com' });
      validateVerifyEmail(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Please provide a valid 6-digit verification code.');
    });

    it('should return error when otp length is not 6', () => {
      const req = createReq({ email: 'john@example.com', otp: '12345' });
      validateVerifyEmail(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Please provide a valid 6-digit verification code.');
    });
  });

  describe('validateResendOtp', () => {
    it('should call next() with no error for valid email', () => {
      const req = createReq({ email: 'john@example.com' });
      validateResendOtp(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when email is missing', () => {
      const req = createReq({});
      validateResendOtp(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Email is required.');
    });

    it('should return error for invalid email format', () => {
      const req = createReq({ email: 'not-an-email' });
      validateResendOtp(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Please provide a valid email address.');
    });
  });
});
