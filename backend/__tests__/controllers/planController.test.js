const planController = require('../../controllers/planController');
const planService = require('../../services/planService');
const AppError = require('../../utils/appError');

jest.mock('../../services/planService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('planController', () => {
  describe('getPlans', () => {
    it('should return plans for unauthenticated user (active only)', async () => {
      const req = { user: null };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlans.mockResolvedValue([{ name: 'Basic' }]);

      await planController.getPlans(req, res, next);

      expect(planService.getPlans).toHaveBeenCalledWith(null);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return active-only plans for regular USER', async () => {
      const req = { user: { role: 'USER' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlans.mockResolvedValue([]);

      await planController.getPlans(req, res, next);

      expect(planService.getPlans).toHaveBeenCalledWith(false);
    });

    it('should return all plans for admin', async () => {
      const req = { user: { role: 'ADMIN' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlans.mockResolvedValue([]);

      await planController.getPlans(req, res, next);

      expect(planService.getPlans).toHaveBeenCalledWith(true);
    });

    it('should return all plans for super admin', async () => {
      const req = { user: { role: 'SUPER_ADMIN' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlans.mockResolvedValue([]);

      await planController.getPlans(req, res, next);

      expect(planService.getPlans).toHaveBeenCalledWith(true);
    });

    it('should forward errors to next', async () => {
      const req = { user: null };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlans.mockRejectedValue(new Error('DB error'));

      await planController.getPlans(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPlanById', () => {
    it('should return a plan by ID', async () => {
      const req = { params: { id: 'plan1' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlanById.mockResolvedValue({ _id: 'plan1', name: 'Pro' });

      await planController.getPlanById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward not-found error', async () => {
      const req = { params: { id: 'bad' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.getPlanById.mockRejectedValue(new AppError('Plan not found', 404));

      await planController.getPlanById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createPlan', () => {
    it('should create a plan with all required fields', async () => {
      const req = {
        body: { name: 'Pro', description: 'Desc', price: 999, features: ['A'] }
      };
      const res = createMockRes();
      const next = jest.fn();
      planService.createPlan.mockResolvedValue({ _id: 'new', name: 'Pro' });

      await planController.createPlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error when required fields missing', async () => {
      const req = { body: { name: 'Pro' } };
      const res = createMockRes();
      const next = jest.fn();

      await planController.createPlan(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('updatePlan', () => {
    it('should update a plan', async () => {
      const req = {
        params: { id: 'plan1' },
        body: { name: 'Updated' },
        user: { _id: 'admin1', role: 'ADMIN' }
      };
      const res = createMockRes();
      const next = jest.fn();
      planService.updatePlan.mockResolvedValue({ name: 'Updated' });

      await planController.updatePlan(req, res, next);

      expect(planService.updatePlan).toHaveBeenCalledWith('plan1', { name: 'Updated' }, 'admin1', 'ADMIN');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('archivePlan', () => {
    it('should archive a plan', async () => {
      const req = { params: { id: 'plan1' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.archivePlan.mockResolvedValue({ status: 'ARCHIVED' });

      await planController.archivePlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('restorePlan', () => {
    it('should restore a plan', async () => {
      const req = { params: { id: 'plan1' } };
      const res = createMockRes();
      const next = jest.fn();
      planService.restorePlan.mockResolvedValue({ status: 'ACTIVE' });

      await planController.restorePlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
