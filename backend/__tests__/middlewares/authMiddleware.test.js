const jwt = require('jsonwebtoken');
const { protect, optionalProtect } = require('../../middlewares/authMiddleware');
const AppError = require('../../utils/appError');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

const User = require('../../models/User');

const createReq = (overrides = {}) => ({
  cookies: {},
  headers: {},
  ...overrides
});

const res = {};
let next;

beforeEach(() => {
  next = jest.fn();
  jest.clearAllMocks();
  // Suppress console.log from middleware
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

describe('authMiddleware', () => {
  describe('protect', () => {
    it('should return 401 when no token is provided', async () => {
      const req = createReq();
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toContain('not logged in');
    });

    it('should extract token from cookies', async () => {
      const mockUser = { _id: 'user1', role: 'USER', isActive: true };
      jwt.verify.mockReturnValue({ userId: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should extract token from Authorization header', async () => {
      const mockUser = { _id: 'user1', role: 'USER', isActive: true };
      jwt.verify.mockReturnValue({ userId: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = createReq({ headers: { authorization: 'Bearer valid-token' } });
      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(req.user).toEqual(mockUser);
    });

    it('should return 401 for invalid/expired token', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      const req = createReq({ cookies: { token: 'expired-token' } });
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toContain('Invalid or expired token');
    });

    it('should return 401 when user no longer exists', async () => {
      jwt.verify.mockReturnValue({ userId: 'deleted-user' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toContain('no longer exists');
    });

    it('should return 403 when user is deactivated', async () => {
      const mockUser = { _id: 'user1', role: 'USER', isActive: false };
      jwt.verify.mockReturnValue({ userId: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(next.mock.calls[0][0].message).toContain('deactivated');
    });
  });

  describe('optionalProtect', () => {
    it('should call next() without setting user when no token', async () => {
      const req = createReq();
      await optionalProtect(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should set req.user when valid token is provided', async () => {
      const mockUser = { _id: 'user1', role: 'USER', isActive: true };
      jwt.verify.mockReturnValue({ userId: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await optionalProtect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() without error when token is invalid', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      const req = createReq({ cookies: { token: 'bad-token' } });
      await optionalProtect(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should not set user when user is inactive', async () => {
      const mockUser = { _id: 'user1', role: 'USER', isActive: false };
      jwt.verify.mockReturnValue({ userId: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await optionalProtect(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should not set user when user is not found', async () => {
      jwt.verify.mockReturnValue({ userId: 'deleted-user' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const req = createReq({ cookies: { token: 'valid-token' } });
      await optionalProtect(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });
});
