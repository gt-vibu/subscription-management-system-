const subscriptionService = require('../../services/subscriptionService');
const AppError = require('../../utils/appError');

jest.mock('../../models/Subscription');
jest.mock('../../models/Plan');

const Subscription = require('../../models/Subscription');
const Plan = require('../../models/Plan');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('subscriptionService', () => {
  describe('getActiveSubscriptionsByUserId', () => {
    it('should query for active subscriptions with populate', async () => {
      Subscription.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

      await subscriptionService.getActiveSubscriptionsByUserId('user1');

      expect(Subscription.find).toHaveBeenCalledWith({ user: 'user1', status: 'ACTIVE' });
    });
  });

  describe('getActiveSubscriptionByUserId', () => {
    it('should return the first active subscription', async () => {
      const mockSub = { _id: 'sub1' };
      Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockSub) });

      const result = await subscriptionService.getActiveSubscriptionByUserId('user1');

      expect(result).toEqual(mockSub);
    });
  });

  describe('getUserSubscriptionDetails', () => {
    it('should return active and history subscriptions', async () => {
      Subscription.find.mockImplementation((query) => {
        if (query.status === 'ACTIVE') {
          return { populate: jest.fn().mockResolvedValue([{ _id: 'sub1' }]) };
        }
        return {
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([{ _id: 'sub2', status: 'CANCELLED' }])
          })
        };
      });

      const result = await subscriptionService.getUserSubscriptionDetails('user1');

      expect(result.active).toHaveLength(1);
      expect(result.history).toHaveLength(1);
    });
  });

  describe('subscribe', () => {
    it('should create a monthly subscription', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Plan.findById.mockResolvedValue({ _id: 'plan1', price: 999, status: 'ACTIVE' });
      const createdSub = { _id: 'sub1', status: 'ACTIVE' };
      Subscription.create.mockResolvedValue(createdSub);

      const result = await subscriptionService.subscribe('user1', 'plan1', 'MONTHLY', 1);

      expect(Subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user1',
          plan: 'plan1',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          pricePaid: 999
        })
      );
      expect(result).toEqual(createdSub);
    });

    it('should create an annual subscription with 15% discount', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Plan.findById.mockResolvedValue({ _id: 'plan1', price: 1000, status: 'ACTIVE' });
      Subscription.create.mockResolvedValue({ _id: 'sub1' });

      await subscriptionService.subscribe('user1', 'plan1', 'ANNUAL');

      expect(Subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          billingCycle: 'ANNUAL',
          pricePaid: Math.round(1000 * 12 * 0.85)
        })
      );
    });

    it('should throw if already subscribed to the same plan', async () => {
      Subscription.findOne.mockResolvedValue({ _id: 'existing-sub' });

      await expect(
        subscriptionService.subscribe('user1', 'plan1')
      ).rejects.toThrow('already subscribed to this plan');
    });

    it('should throw if plan not found', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Plan.findById.mockResolvedValue(null);

      await expect(
        subscriptionService.subscribe('user1', 'bad-plan')
      ).rejects.toThrow('Plan not found');
    });

    it('should throw if plan is archived', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Plan.findById.mockResolvedValue({ _id: 'plan1', status: 'ARCHIVED' });

      await expect(
        subscriptionService.subscribe('user1', 'plan1')
      ).rejects.toThrow('archived');
    });

    it('should calculate multi-month price correctly', async () => {
      Subscription.findOne.mockResolvedValue(null);
      Plan.findById.mockResolvedValue({ _id: 'plan1', price: 500, status: 'ACTIVE' });
      Subscription.create.mockResolvedValue({ _id: 'sub1' });

      await subscriptionService.subscribe('user1', 'plan1', 'MONTHLY', 3);

      expect(Subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ pricePaid: 1500 })
      );
    });
  });

  describe('changeSubscriptionPlan', () => {
    it('should change to a new plan', async () => {
      const activeSub = {
        _id: 'sub1',
        plan: { _id: 'plan1', price: 500 },
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue({})
      };
      Subscription.findOne.mockImplementation((query) => {
        if (query._id === 'sub1') {
          return { populate: jest.fn().mockResolvedValue(activeSub) };
        }
        return jest.fn().mockResolvedValue(null);
      });
      // Second call for existing on target
      Subscription.findOne
        .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(activeSub) })
        .mockResolvedValueOnce(null);

      Plan.findById.mockResolvedValue({ _id: 'plan2', price: 1000, status: 'ACTIVE' });
      Subscription.create.mockResolvedValue({ _id: 'sub2' });

      const result = await subscriptionService.changeSubscriptionPlan('user1', 'sub1', 'plan2');

      expect(activeSub.status).toBe('EXPIRED');
      expect(activeSub.save).toHaveBeenCalled();
      expect(Subscription.create).toHaveBeenCalled();
      expect(result.type).toBe('upgrade');
    });

    it('should throw when active subscription not found', async () => {
      Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(
        subscriptionService.changeSubscriptionPlan('user1', 'sub1', 'plan2')
      ).rejects.toThrow('Active subscription not found');
    });

    it('should throw when changing to the same plan', async () => {
      const activeSub = {
        _id: 'sub1',
        plan: { _id: 'plan1', price: 500 },
        status: 'ACTIVE'
      };
      Subscription.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(activeSub) });

      await expect(
        subscriptionService.changeSubscriptionPlan('user1', 'sub1', 'plan1')
      ).rejects.toThrow('already subscribed to this plan');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      const mockSub = {
        _id: 'sub1',
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue({ _id: 'sub1', status: 'CANCELLED' })
      };
      Subscription.findOne.mockResolvedValue(mockSub);

      const result = await subscriptionService.cancelSubscription('user1', 'sub1');

      expect(mockSub.status).toBe('CANCELLED');
      expect(mockSub.save).toHaveBeenCalled();
    });

    it('should throw when no active subscription found', async () => {
      Subscription.findOne.mockResolvedValue(null);

      await expect(
        subscriptionService.cancelSubscription('user1', 'sub1')
      ).rejects.toThrow('No active subscription found');
    });

    it('should cancel without subscriptionId (first active)', async () => {
      const mockSub = {
        _id: 'sub1',
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue({})
      };
      Subscription.findOne.mockResolvedValue(mockSub);

      await subscriptionService.cancelSubscription('user1');

      expect(Subscription.findOne).toHaveBeenCalledWith({ user: 'user1', status: 'ACTIVE' });
      expect(mockSub.status).toBe('CANCELLED');
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return all subscriptions with populated fields', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'sub1' }])
      };
      Subscription.find.mockReturnValue(mockChain);

      const result = await subscriptionService.getAllSubscriptions();

      expect(Subscription.find).toHaveBeenCalledWith({});
      expect(result).toEqual([{ _id: 'sub1' }]);
    });
  });
});
