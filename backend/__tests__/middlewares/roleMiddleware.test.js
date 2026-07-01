const { restrictTo } = require('../../middlewares/roleMiddleware');
const AppError = require('../../utils/appError');

const res = {};
let next;

beforeEach(() => {
  next = jest.fn();
});

describe('roleMiddleware - restrictTo', () => {
  it('should call next() when user has an allowed role', () => {
    const middleware = restrictTo('ADMIN', 'SUPER_ADMIN');
    const req = { user: { role: 'ADMIN' } };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next() for SUPER_ADMIN when allowed', () => {
    const middleware = restrictTo('ADMIN', 'SUPER_ADMIN');
    const req = { user: { role: 'SUPER_ADMIN' } };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should return 403 when user role is not allowed', () => {
    const middleware = restrictTo('ADMIN', 'SUPER_ADMIN');
    const req = { user: { role: 'USER' } };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(next.mock.calls[0][0].message).toContain('permission');
  });

  it('should return 403 when req.user is undefined', () => {
    const middleware = restrictTo('ADMIN');
    const req = {};

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('should work with a single role', () => {
    const middleware = restrictTo('SUPER_ADMIN');
    const req = { user: { role: 'SUPER_ADMIN' } };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject when single role does not match', () => {
    const middleware = restrictTo('SUPER_ADMIN');
    const req = { user: { role: 'ADMIN' } };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});
