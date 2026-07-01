const statsController = require('../../controllers/statsController');
const statsService = require('../../services/statsService');

jest.mock('../../services/statsService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('statsController', () => {
  describe('getPlatformStats', () => {
    it('should return platform statistics', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      const mockStats = {
        users: { total: 100, roles: { USER: 90, ADMIN: 8, SUPER_ADMIN: 2 } },
        subscriptions: { active: 50, total: 80, mrr: 50000 },
        plans: []
      };
      statsService.getPlatformStats.mockResolvedValue(mockStats);

      await statsController.getPlatformStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockStats })
      );
    });

    it('should forward errors to next', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      statsService.getPlatformStats.mockRejectedValue(new Error('DB error'));

      await statsController.getPlatformStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPricingLogs', () => {
    it('should return pricing logs', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      statsService.getPricingLogs.mockResolvedValue([{ planName: 'Pro', oldPrice: 100, newPrice: 200 }]);

      await statsController.getPricingLogs(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      statsService.getPricingLogs.mockRejectedValue(new Error('fail'));

      await statsController.getPricingLogs(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPublicStats', () => {
    it('should return public platform statistics', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      statsService.getPublicPlatformStats.mockResolvedValue({
        totalUsers: 50,
        activeSubs: 20,
        totalMRR: 10000,
        recentSubscribers: []
      });

      await statsController.getPublicStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      statsService.getPublicPlatformStats.mockRejectedValue(new Error('fail'));

      await statsController.getPublicStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
