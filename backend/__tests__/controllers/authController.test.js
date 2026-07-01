const authController = require('../../controllers/authController');
const authService = require('../../services/authService');
const User = require('../../models/User');
const AppError = require('../../utils/appError');

jest.mock('../../services/authService');
jest.mock('../../models/User');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_EXPIRES_IN = '30m';
});

describe('authController', () => {
  describe('register', () => {
    it('should register user and set cookie', async () => {
      const req = { body: { name: 'John', email: 'john@test.com', password: 'Password1!' } };
      const res = createMockRes();
      const next = jest.fn();

      authService.registerUser.mockResolvedValue({
        _id: 'user1',
        name: 'John',
        email: 'john@test.com',
        role: 'USER'
      });
      authService.generateToken.mockReturnValue('mock-token');

      await authController.register(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mock-token',
        expect.objectContaining({ httpOnly: true, secure: true })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Registration successful.' })
      );
    });

    it('should call next with error when fields are missing', async () => {
      const req = { body: { name: 'John' } };
      const res = createMockRes();
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should forward service errors to next', async () => {
      const req = { body: { name: 'John', email: 'john@test.com', password: 'Password1!' } };
      const res = createMockRes();
      const next = jest.fn();

      authService.registerUser.mockRejectedValue(new AppError('Email exists', 400));

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('login', () => {
    it('should login user and set cookie', async () => {
      const req = { body: { email: 'john@test.com', password: 'Password1!' } };
      const res = createMockRes();
      const next = jest.fn();

      authService.loginUser.mockResolvedValue({ _id: 'user1', role: 'USER' });
      authService.generateToken.mockReturnValue('login-token');

      await authController.login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('token', 'login-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward login errors to next', async () => {
      const req = { body: { email: 'john@test.com', password: 'wrong' } };
      const res = createMockRes();
      const next = jest.fn();

      authService.loginUser.mockRejectedValue(new AppError('Incorrect', 401));

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success', () => {
      const req = {};
      const res = createMockRes();

      authController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: { _id: 'user1' } };
      const res = createMockRes();
      const next = jest.fn();

      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user1', name: 'John' }) });

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when user not found', async () => {
      const req = { user: { _id: 'deleted' } };
      const res = createMockRes();
      const next = jest.fn();

      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await authController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });
});
