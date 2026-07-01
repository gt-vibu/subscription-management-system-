const errorHandler = require('../../middlewares/errorMiddleware');
const AppError = require('../../utils/appError');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req = {};
const next = jest.fn();

describe('errorMiddleware', () => {
  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return full error details including stack', () => {
      const res = createMockRes();
      const err = new AppError('Bad request', 400);

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: 'fail',
          message: 'Bad request',
          stack: expect.any(String)
        })
      );
    });

    it('should default to 500 when statusCode is not set', () => {
      const res = createMockRes();
      const err = new Error('Something broke');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: 'error'
        })
      );
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterAll(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should return operational error message for AppError', () => {
      const res = createMockRes();
      const err = new AppError('Not found', 404);

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe('Not found');
      expect(body.stack).toBeUndefined();
    });

    it('should hide details for non-operational errors', () => {
      const res = createMockRes();
      const err = new Error('Database crashed');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toBe('Something went wrong on our end.');
      expect(body.stack).toBeUndefined();

      console.error.mockRestore();
    });
  });
});
