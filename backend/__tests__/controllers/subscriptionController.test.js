const subscriptionController = require('../../controllers/subscriptionController');
const subscriptionService = require('../../services/subscriptionService');
const AppError = require('../../utils/appError');

jest.mock('../../services/subscriptionService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('subscriptionController', () => {
  describe('getMySubscription', () => {
    it('should return subscription details for logged in user', async () => {
      const req = { user: { _id: 'user1' } };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.getUserSubscriptionDetails.mockResolvedValue({
        active: [{ _id: 'sub1' }],
        history: []
      });

      await subscriptionController.getMySubscription(req, res, next);

      expect(subscriptionService.getUserSubscriptionDetails).toHaveBeenCalledWith('user1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = { user: { _id: 'user1' } };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.getUserSubscriptionDetails.mockRejectedValue(new Error('fail'));

      await subscriptionController.getMySubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('subscribeToPlan', () => {
    it('should subscribe user to a plan', async () => {
      const req = { user: { _id: 'user1' }, body: { planId: 'plan1', billingCycle: 'MONTHLY' } };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.subscribe.mockResolvedValue({ _id: 'sub1', status: 'ACTIVE' });

      await subscriptionController.subscribeToPlan(req, res, next);

      expect(subscriptionService.subscribe).toHaveBeenCalledWith('user1', 'plan1', 'MONTHLY', undefined);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error when planId is missing', async () => {
      const req = { user: { _id: 'user1' }, body: {} };
      const res = createMockRes();
      const next = jest.fn();

      await subscriptionController.subscribeToPlan(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain('planId');
    });

    it('should pass months as number', async () => {
      const req = { user: { _id: 'user1' }, body: { planId: 'plan1', months: '3' } };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.subscribe.mockResolvedValue({ _id: 'sub1' });

      await subscriptionController.subscribeToPlan(req, res, next);

      expect(subscriptionService.subscribe).toHaveBeenCalledWith('user1', 'plan1', undefined, 3);
    });
  });

  describe('changePlan', () => {
    it('should change subscription plan', async () => {
      const req = {
        user: { _id: 'user1' },
        body: { planId: 'plan2', subscriptionId: 'sub1' }
      };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.changeSubscriptionPlan.mockResolvedValue({
        subscription: { _id: 'sub2' },
        type: 'upgrade'
      });

      await subscriptionController.changePlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Subscription upgraded successfully' })
      );
    });

    it('should show downgrade message', async () => {
      const req = {
        user: { _id: 'user1' },
        body: { planId: 'plan2', subscriptionId: 'sub1' }
      };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.changeSubscriptionPlan.mockResolvedValue({
        subscription: { _id: 'sub2' },
        type: 'downgrade'
      });

      await subscriptionController.changePlan(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Subscription downgraded successfully' })
      );
    });

    it('should return error when planId is missing', async () => {
      const req = { user: { _id: 'user1' }, body: { subscriptionId: 'sub1' } };
      const res = createMockRes();
      const next = jest.fn();

      await subscriptionController.changePlan(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error when subscriptionId is missing', async () => {
      const req = { user: { _id: 'user1' }, body: { planId: 'plan2' } };
      const res = createMockRes();
      const next = jest.fn();

      await subscriptionController.changePlan(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      const req = { user: { _id: 'user1' }, body: { subscriptionId: 'sub1' } };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.cancelSubscription.mockResolvedValue({ _id: 'sub1', status: 'CANCELLED' });

      await subscriptionController.cancelSubscription(req, res, next);

      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith('user1', 'sub1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = { user: { _id: 'user1' }, body: {} };
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.cancelSubscription.mockRejectedValue(new AppError('No active', 400));

      await subscriptionController.cancelSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return all subscriptions', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      subscriptionService.getAllSubscriptions.mockResolvedValue([{ _id: 'sub1' }]);

      await subscriptionController.getAllSubscriptions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
