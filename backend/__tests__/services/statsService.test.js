const statsService = require('../../services/statsService');

jest.mock('../../models/User');
jest.mock('../../models/Plan');
jest.mock('../../models/Subscription');
jest.mock('../../models/PricingLog');

const User = require('../../models/User');
const Plan = require('../../models/Plan');
const Subscription = require('../../models/Subscription');
const PricingLog = require('../../models/PricingLog');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('statsService', () => {
  describe('getPlatformStats', () => {
    it('should return aggregated platform statistics', async () => {
      User.countDocuments.mockResolvedValue(100);
      User.aggregate.mockResolvedValue([
        { _id: 'USER', count: 90 },
        { _id: 'ADMIN', count: 8 },
        { _id: 'SUPER_ADMIN', count: 2 }
      ]);

      const plans = [
        { _id: 'p1', name: 'Basic', price: 1000, billingCycle: 'MONTHLY', status: 'ACTIVE' },
        { _id: 'p2', name: 'Pro', price: 12000, billingCycle: 'ANNUAL', status: 'ACTIVE' }
      ];
      // Need toString on _id
      plans.forEach(p => { p._id = { toString: () => p._id.toString ? p._id : p._id }; });
      // Fix: use proper string-convertible _id
      const plan1 = { _id: 'p1', name: 'Basic', price: 1000, billingCycle: 'MONTHLY', status: 'ACTIVE' };
      const plan2 = { _id: 'p2', name: 'Pro', price: 12000, billingCycle: 'ANNUAL', status: 'ACTIVE' };
      plan1._id = { toString: () => 'p1' };
      plan2._id = { toString: () => 'p2' };

      Plan.find.mockResolvedValue([plan1, plan2]);

      const activeSubs = [
        { plan: { _id: { toString: () => 'p1' }, price: 1000, billingCycle: 'MONTHLY' } },
        { plan: { _id: { toString: () => 'p1' }, price: 1000, billingCycle: 'MONTHLY' } },
        { plan: { _id: { toString: () => 'p2' }, price: 12000, billingCycle: 'ANNUAL' } },
        { plan: null }
      ];
      Subscription.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(activeSubs) });
      Subscription.countDocuments.mockResolvedValue(50);

      const result = await statsService.getPlatformStats();

      expect(result.users.total).toBe(100);
      expect(result.users.roles.USER).toBe(90);
      expect(result.users.roles.ADMIN).toBe(8);
      expect(result.users.roles.SUPER_ADMIN).toBe(2);
      expect(result.subscriptions.active).toBe(4);
      expect(result.subscriptions.total).toBe(50);
      // MRR: 2*1000 (monthly) + 12000/12 = 2000 + 1000 = 3000
      expect(result.subscriptions.mrr).toBe(3000);
      expect(result.plans).toHaveLength(2);
    });

    it('should handle empty data', async () => {
      User.countDocuments.mockResolvedValue(0);
      User.aggregate.mockResolvedValue([]);
      Subscription.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
      Subscription.countDocuments.mockResolvedValue(0);
      Plan.find.mockResolvedValue([]);

      const result = await statsService.getPlatformStats();

      expect(result.users.total).toBe(0);
      expect(result.subscriptions.mrr).toBe(0);
      expect(result.plans).toHaveLength(0);
    });
  });

  describe('getPricingLogs', () => {
    it('should return pricing logs sorted by changedAt desc', async () => {
      const mockLogs = [{ planName: 'Pro', oldPrice: 100, newPrice: 200 }];
      PricingLog.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockLogs)
        })
      });

      const result = await statsService.getPricingLogs();

      expect(PricingLog.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getPublicPlatformStats', () => {
    it('should return public stats with obfuscated emails', async () => {
      User.countDocuments.mockResolvedValue(50);
      Subscription.countDocuments.mockResolvedValue(20);
      Subscription.find.mockImplementation((query) => {
        if (query.status === 'ACTIVE' && !query.user) {
          // First call: active subscriptions list for MRR
          return {
            populate: jest.fn().mockResolvedValue([
              { plan: { price: 1000, billingCycle: 'MONTHLY' } },
              { plan: { price: 6000, billingCycle: 'ANNUAL' } }
            ])
          };
        }
        // Second call: recent subscriptions
        return {
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                  {
                    _id: 'sub1',
                    user: { name: 'John Doe', email: 'john@example.com' },
                    plan: { name: 'Basic' },
                    status: 'ACTIVE',
                    createdAt: new Date()
                  },
                  {
                    _id: 'sub2',
                    user: { name: 'Alice', email: 'ab@test.com' },
                    plan: { name: 'Pro' },
                    status: 'ACTIVE',
                    createdAt: new Date()
                  },
                  {
                    _id: 'sub3',
                    user: null,
                    plan: null,
                    status: 'CANCELLED',
                    createdAt: new Date()
                  }
                ])
              })
            })
          })
        };
      });

      const result = await statsService.getPublicPlatformStats();

      expect(result.totalUsers).toBe(50);
      expect(result.activeSubs).toBe(20);
      // MRR: 1000 + 6000/12 = 1000 + 500 = 1500
      expect(result.totalMRR).toBe(1500);
      expect(result.recentSubscribers).toHaveLength(3);
      // Obfuscated emails
      expect(result.recentSubscribers[0].email).toBe('jo***n@example.com');
      expect(result.recentSubscribers[2].name).toBe('Unknown User');
      expect(result.recentSubscribers[2].email).toBe('N/A');
    });

    it('should handle short email names', async () => {
      User.countDocuments.mockResolvedValue(1);
      Subscription.countDocuments.mockResolvedValue(1);
      Subscription.find.mockImplementation((query) => {
        if (query.status === 'ACTIVE' && !query.user) {
          return { populate: jest.fn().mockResolvedValue([]) };
        }
        return {
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                  {
                    _id: 'sub1',
                    user: { name: 'X', email: 'ab@t.com' },
                    plan: { name: 'Basic' },
                    status: 'ACTIVE',
                    createdAt: new Date()
                  }
                ])
              })
            })
          })
        };
      });

      const result = await statsService.getPublicPlatformStats();

      expect(result.recentSubscribers[0].email).toBe('a***@t.com');
    });
  });
});
