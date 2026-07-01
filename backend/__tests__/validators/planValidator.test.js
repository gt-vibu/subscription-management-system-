const { validatePlanCreate, validatePlanUpdate } = require('../../validators/planValidator');
const AppError = require('../../utils/appError');

const res = {};
const next = jest.fn();

beforeEach(() => {
  next.mockClear();
});

describe('planValidator', () => {
  describe('validatePlanCreate', () => {
    const validBody = {
      name: 'Pro Plan',
      description: 'A professional plan',
      price: 999,
      billingCycle: 'MONTHLY',
      features: ['Feature A', 'Feature B']
    };

    it('should call next() for valid input', () => {
      const req = { body: { ...validBody } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when name is missing', () => {
      const req = { body: { ...validBody, name: undefined } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan name is required.');
    });

    it('should return error when name is empty', () => {
      const req = { body: { ...validBody, name: '   ' } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan name is required.');
    });

    it('should return error when description is missing', () => {
      const req = { body: { ...validBody, description: undefined } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan description is required.');
    });

    it('should return error when price is not a number', () => {
      const req = { body: { ...validBody, price: 'free' } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Price must be a positive number in cents.');
    });

    it('should return error when price is negative', () => {
      const req = { body: { ...validBody, price: -100 } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Price must be a positive number in cents.');
    });

    it('should return error when price is undefined', () => {
      const req = { body: { ...validBody, price: undefined } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Price must be a positive number in cents.');
    });

    it('should allow price of 0', () => {
      const req = { body: { ...validBody, price: 0 } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error for invalid billing cycle', () => {
      const req = { body: { ...validBody, billingCycle: 'WEEKLY' } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Billing cycle must be either MONTHLY or ANNUAL.');
    });

    it('should allow billingCycle to be omitted', () => {
      const req = { body: { ...validBody, billingCycle: undefined } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when features is missing', () => {
      const req = { body: { ...validBody, features: undefined } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan must have a non-empty array of features.');
    });

    it('should return error when features is empty array', () => {
      const req = { body: { ...validBody, features: [] } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan must have a non-empty array of features.');
    });

    it('should return error when features is not an array', () => {
      const req = { body: { ...validBody, features: 'feature' } };
      validatePlanCreate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validatePlanUpdate', () => {
    it('should call next() when no fields are provided (no-op update)', () => {
      const req = { body: {} };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() for valid partial update', () => {
      const req = { body: { name: 'Updated Plan', price: 1500 } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error when name is empty string', () => {
      const req = { body: { name: '  ' } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan name cannot be empty.');
    });

    it('should return error when description is empty string', () => {
      const req = { body: { description: '  ' } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Plan description cannot be empty.');
    });

    it('should return error when price is not a number', () => {
      const req = { body: { price: 'abc' } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Price must be a positive number in cents.');
    });

    it('should return error when price is negative', () => {
      const req = { body: { price: -50 } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error for invalid billing cycle', () => {
      const req = { body: { billingCycle: 'DAILY' } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error when features is empty array', () => {
      const req = { body: { features: [] } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Features must be a non-empty array.');
    });

    it('should return error when features is not an array', () => {
      const req = { body: { features: 'not-array' } };
      validatePlanUpdate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
