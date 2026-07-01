const planService = require('../../services/planService');
const AppError = require('../../utils/appError');

jest.mock('../../models/Plan');
jest.mock('../../models/PricingLog');
jest.mock('../../models/Subscription');

const Plan = require('../../models/Plan');
const PricingLog = require('../../models/PricingLog');
const Subscription = require('../../models/Subscription');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('planService', () => {
  describe('getPlans', () => {
    it('should return only ACTIVE plans for non-admin', async () => {
      Plan.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ name: 'Basic' }]) });

      await planService.getPlans(false);

      expect(Plan.find).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });

    it('should return all plans for admin', async () => {
      Plan.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await planService.getPlans(true);

      expect(Plan.find).toHaveBeenCalledWith({});
    });
  });

  describe('getPlanById', () => {
    it('should return a plan when found', async () => {
      const mockPlan = { _id: 'plan1', name: 'Pro' };
      Plan.findById.mockResolvedValue(mockPlan);

      const result = await planService.getPlanById('plan1');

      expect(result).toEqual(mockPlan);
    });

    it('should throw AppError when plan not found', async () => {
      Plan.findById.mockResolvedValue(null);

      await expect(planService.getPlanById('nonexistent')).rejects.toThrow(AppError);
      await expect(planService.getPlanById('nonexistent')).rejects.toThrow('Plan not found');
    });
  });

  describe('createPlan', () => {
    it('should create a plan when name is unique', async () => {
      Plan.findOne.mockResolvedValue(null);
      const newPlan = { _id: 'new', name: 'Enterprise' };
      Plan.create.mockResolvedValue(newPlan);

      const result = await planService.createPlan({ name: 'Enterprise', price: 5000 });

      expect(Plan.findOne).toHaveBeenCalledWith({ name: 'Enterprise' });
      expect(Plan.create).toHaveBeenCalled();
      expect(result).toEqual(newPlan);
    });

    it('should throw when plan name already exists', async () => {
      Plan.findOne.mockResolvedValue({ name: 'Enterprise' });

      await expect(planService.createPlan({ name: 'Enterprise' })).rejects.toThrow(
        'A plan with this name already exists'
      );
    });
  });

  describe('updatePlan', () => {
    it('should update plan fields without price change', async () => {
      const mockPlan = {
        _id: 'plan1',
        name: 'Pro',
        price: 1000,
        save: jest.fn().mockResolvedValue({ _id: 'plan1', name: 'Pro Updated' })
      };
      Plan.findById.mockResolvedValue(mockPlan);

      const result = await planService.updatePlan('plan1', { name: 'Pro Updated' }, 'admin1', 'ADMIN');

      expect(PricingLog.create).not.toHaveBeenCalled();
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should throw when plan not found', async () => {
      Plan.findById.mockResolvedValue(null);

      await expect(
        planService.updatePlan('bad-id', {}, 'admin1', 'ADMIN')
      ).rejects.toThrow('Plan not found');
    });

    it('should create a pricing log when price changes', async () => {
      const mockPlan = {
        _id: 'plan1',
        name: 'Pro',
        price: 1000,
        save: jest.fn().mockResolvedValue({})
      };
      Plan.findById.mockResolvedValue(mockPlan);
      PricingLog.create.mockResolvedValue({});

      await planService.updatePlan('plan1', { price: 1500 }, 'admin1', 'SUPER_ADMIN');

      expect(PricingLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldPrice: 1000,
          newPrice: 1500,
          changedBy: 'admin1',
          actorRole: 'SUPER_ADMIN'
        })
      );
    });

    it('should adjust active subscriptions when retroactive flag is set', async () => {
      const mockSub = {
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        save: jest.fn().mockResolvedValue({})
      };
      const mockPlan = {
        _id: 'plan1',
        name: 'Pro',
        price: 1000,
        save: jest.fn().mockResolvedValue({})
      };
      Plan.findById.mockResolvedValue(mockPlan);
      PricingLog.create.mockResolvedValue({});
      Subscription.find.mockResolvedValue([mockSub]);

      await planService.updatePlan('plan1', { price: 500, retroactive: true }, 'admin1', 'ADMIN');

      expect(Subscription.find).toHaveBeenCalledWith({ plan: 'plan1', status: 'ACTIVE' });
      expect(mockSub.save).toHaveBeenCalled();
    });

    it('should not save retroactive flag to plan document', async () => {
      const mockPlan = {
        _id: 'plan1',
        name: 'Pro',
        price: 1000,
        save: jest.fn().mockResolvedValue({})
      };
      Plan.findById.mockResolvedValue(mockPlan);
      PricingLog.create.mockResolvedValue({});
      Subscription.find.mockResolvedValue([]);

      await planService.updatePlan('plan1', { price: 1500, retroactive: true }, 'admin1', 'ADMIN');

      expect(mockPlan.retroactive).toBeUndefined();
    });
  });

  describe('archivePlan', () => {
    it('should archive an active plan', async () => {
      const mockPlan = {
        _id: 'plan1',
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue({
          _id: 'plan1',
          status: 'ARCHIVED',
          toObject: () => ({ _id: 'plan1', status: 'ARCHIVED' })
        }),
        toObject: () => ({ _id: 'plan1', status: 'ARCHIVED' })
      };
      // Override save to return the plan itself with toObject
      mockPlan.save.mockResolvedValue(mockPlan);
      Plan.findById.mockResolvedValue(mockPlan);
      Subscription.countDocuments.mockResolvedValue(5);

      const result = await planService.archivePlan('plan1');

      expect(mockPlan.status).toBe('ARCHIVED');
      expect(result.activeSubscriberCount).toBe(5);
    });

    it('should throw when plan is already archived', async () => {
      Plan.findById.mockResolvedValue({ _id: 'plan1', status: 'ARCHIVED' });

      await expect(planService.archivePlan('plan1')).rejects.toThrow('already archived');
    });

    it('should throw when plan not found', async () => {
      Plan.findById.mockResolvedValue(null);

      await expect(planService.archivePlan('bad-id')).rejects.toThrow('Plan not found');
    });
  });

  describe('restorePlan', () => {
    it('should restore an archived plan', async () => {
      const mockPlan = {
        _id: 'plan1',
        status: 'ARCHIVED',
        save: jest.fn().mockResolvedValue({ _id: 'plan1', status: 'ACTIVE' })
      };
      Plan.findById.mockResolvedValue(mockPlan);

      await planService.restorePlan('plan1');

      expect(mockPlan.status).toBe('ACTIVE');
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should throw when plan is already active', async () => {
      Plan.findById.mockResolvedValue({ _id: 'plan1', status: 'ACTIVE' });

      await expect(planService.restorePlan('plan1')).rejects.toThrow('already active');
    });

    it('should throw when plan not found', async () => {
      Plan.findById.mockResolvedValue(null);

      await expect(planService.restorePlan('bad-id')).rejects.toThrow('Plan not found');
    });
  });
});
