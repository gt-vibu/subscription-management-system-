const jwt = require('jsonwebtoken');
const authService = require('../../services/authService');
const AppError = require('../../utils/appError');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('../../services/emailService');

const User = require('../../models/User');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '30m';
});

describe('authService', () => {
  describe('generateToken', () => {
    it('should call jwt.sign with userId and role', () => {
      jwt.sign.mockReturnValue('mock-token');

      const token = authService.generateToken('user123', 'USER');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: 'USER' },
        'test-secret',
        { expiresIn: '30m' }
      );
      expect(token).toBe('mock-token');
    });

    it('should default to 30m if JWT_EXPIRES_IN is not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      jwt.sign.mockReturnValue('token');

      authService.generateToken('id', 'ADMIN');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: '30m' }
      );
    });
  });

  describe('registerUser', () => {
    it('should create a new user and return user without password', async () => {
      User.findOne.mockResolvedValue(null);

      const savedUser = {
        _id: 'new-id',
        name: 'John',
        email: 'john@example.com',
        password: 'hashed',
        role: 'USER',
        isActive: true,
        isVerified: true,
        toObject: function () {
          return { ...this };
        }
      };
      const mockInstance = {
        ...savedUser,
        save: jest.fn().mockResolvedValue(savedUser),
        toObject: savedUser.toObject
      };
      User.mockImplementation(() => mockInstance);

      const result = await authService.registerUser('John', 'john@example.com', 'Password1!');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
      expect(result.name).toBe('John');
    });

    it('should throw AppError when email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      await expect(
        authService.registerUser('John', 'john@example.com', 'Password1!')
      ).rejects.toThrow(AppError);

      await expect(
        authService.registerUser('John', 'john@example.com', 'Password1!')
      ).rejects.toThrow('Email is already registered');
    });
  });

  describe('loginUser', () => {
    it('should throw when email or password not provided', async () => {
      await expect(authService.loginUser('', 'pass')).rejects.toThrow('Please provide email and password');
      await expect(authService.loginUser('email@test.com', '')).rejects.toThrow('Please provide email and password');
    });

    it('should throw when user is not found', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(
        authService.loginUser('john@example.com', 'Password1!')
      ).rejects.toThrow('Incorrect email or password');
    });

    it('should throw when account is locked', async () => {
      const lockedUser = {
        _id: 'user1',
        lockUntil: Date.now() + 10 * 60 * 1000,
        loginAttempts: 0
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(lockedUser) });

      await expect(
        authService.loginUser('john@example.com', 'Password1!')
      ).rejects.toThrow('temporarily locked');
    });

    it('should increment loginAttempts on wrong password', async () => {
      const mockUser = {
        _id: 'user1',
        loginAttempts: 2,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await expect(
        authService.loginUser('john@example.com', 'wrong-pass')
      ).rejects.toThrow('Incorrect email or password');

      expect(mockUser.loginAttempts).toBe(3);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        _id: 'user1',
        loginAttempts: 4,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await expect(
        authService.loginUser('john@example.com', 'wrong-pass')
      ).rejects.toThrow('temporarily locked for 15 minutes');

      expect(mockUser.lockUntil).toBeDefined();
      expect(mockUser.loginAttempts).toBe(0);
    });

    it('should throw when account is deactivated', async () => {
      const mockUser = {
        _id: 'user1',
        isActive: false,
        loginAttempts: 0,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await expect(
        authService.loginUser('john@example.com', 'Password1!')
      ).rejects.toThrow('deactivated');
    });

    it('should return user without password on successful login', async () => {
      const mockUser = {
        _id: 'user1',
        name: 'John',
        email: 'john@example.com',
        password: 'hashed',
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        toObject: function () {
          return { _id: this._id, name: this.name, email: this.email, password: this.password };
        }
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const result = await authService.loginUser('john@example.com', 'Password1!');

      expect(result.password).toBeUndefined();
      expect(result.name).toBe('John');
    });

    it('should reset loginAttempts on successful login when attempts > 0', async () => {
      const mockUser = {
        _id: 'user1',
        isActive: true,
        loginAttempts: 3,
        lockUntil: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        toObject: function () {
          return { _id: this._id };
        }
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await authService.loginUser('john@example.com', 'Password1!');

      expect(mockUser.loginAttempts).toBe(0);
      expect(mockUser.lockUntil).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
