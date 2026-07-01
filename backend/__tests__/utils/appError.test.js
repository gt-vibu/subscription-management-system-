const AppError = require('../../utils/appError');

describe('AppError', () => {
  it('should create an error with the given message and status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should set status to "fail" for 4xx status codes', () => {
    expect(new AppError('Bad request', 400).status).toBe('fail');
    expect(new AppError('Unauthorized', 401).status).toBe('fail');
    expect(new AppError('Forbidden', 403).status).toBe('fail');
    expect(new AppError('Not found', 404).status).toBe('fail');
    expect(new AppError('Conflict', 409).status).toBe('fail');
    expect(new AppError('Unprocessable', 422).status).toBe('fail');
  });

  it('should set status to "error" for 5xx status codes', () => {
    expect(new AppError('Internal', 500).status).toBe('error');
    expect(new AppError('Bad gateway', 502).status).toBe('error');
    expect(new AppError('Service unavailable', 503).status).toBe('error');
  });

  it('should capture a stack trace', () => {
    const error = new AppError('Test error', 500);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('appError.test.js');
  });

  it('should set isOperational to true', () => {
    const error = new AppError('Operational error', 400);
    expect(error.isOperational).toBe(true);
  });
});
