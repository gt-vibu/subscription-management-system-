const userService = require('../../services/userService');
const AppError = require('../../utils/appError');

jest.mock('../../models/User');
jest.mock('../../services/subscriptionService');

const User = require('../../models/User');
const subscriptionService = require('../../services/subscriptionService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userService', () => {
  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [{ name: 'Alice' }];
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(1);

      const result = await userService.getUsers('', 1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await userService.getUsers('john', 1, 10);

      const filterArg = User.find.mock.calls[0][0];
      expect(filterArg.$or).toBeDefined();
      expect(filterArg.$or).toHaveLength(2);
    });

    it('should apply role filter', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await userService.getUsers('', 1, 10, 'ADMIN');

      const filterArg = User.find.mock.calls[0][0];
      expect(filterArg.role).toBeDefined();
    });

    it('should not apply role filter for "ALL"', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await userService.getUsers('', 1, 10, 'ALL');

      const filterArg = User.find.mock.calls[0][0];
      expect(filterArg.role).toBeUndefined();
    });

    it('should apply sort options', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(0);

      await userService.getUsers('', 1, 10, '', 'name', 'desc');

      const sortArg = User.find.mock.results[0].value.select.mock.results[0].value.sort.mock.calls[0][0];
      expect(sortArg).toEqual({ name: -1 });
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      const mockUser = {
        _id: 'target1',
        role: 'USER',
        save: jest.fn().mockResolvedValue({}),
        toObject: () => ({ _id: 'target1', role: 'ADMIN' })
      };
      User.findById.mockResolvedValue(mockUser);

      const result = await userService.changeRole('target1', 'ADMIN', 'actor1');

      expect(mockUser.role).toBe('ADMIN');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.password).toBeUndefined();
    });

    it('should throw when trying to change own role', async () => {
      await expect(
        userService.changeRole('user1', 'ADMIN', 'user1')
      ).rejects.toThrow('cannot change your own role');
    });

    it('should throw for invalid role', async () => {
      await expect(
        userService.changeRole('target1', 'INVALID', 'actor1')
      ).rejects.toThrow('Invalid role');
    });

    it('should throw when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        userService.changeRole('nonexistent', 'ADMIN', 'actor1')
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete the target user', async () => {
      User.findById.mockResolvedValue({ _id: 'target1' });
      User.findByIdAndDelete.mockResolvedValue({});

      const result = await userService.deleteUser('target1', 'actor1');

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('target1');
      expect(result.id).toBe('target1');
    });

    it('should throw when trying to delete yourself', async () => {
      await expect(
        userService.deleteUser('user1', 'user1')
      ).rejects.toThrow('cannot delete your own account');
    });

    it('should throw when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        userService.deleteUser('nonexistent', 'actor1')
      ).rejects.toThrow('User not found');
    });
  });

  describe('createUserAccount', () => {
    it('should create a new user with specified role', async () => {
      User.findOne.mockResolvedValue(null);
      const mockInstance = {
        save: jest.fn().mockResolvedValue({}),
        toObject: () => ({ _id: 'new1', name: 'Alice', email: 'alice@test.com', role: 'ADMIN', password: 'hashed' })
      };
      User.mockImplementation(() => mockInstance);

      const result = await userService.createUserAccount('Alice', 'alice@test.com', 'Password1!', 'ADMIN');

      expect(result.password).toBeUndefined();
      expect(result.name).toBe('Alice');
    });

    it('should throw when email is already registered', async () => {
      User.findOne.mockResolvedValue({ email: 'alice@test.com' });

      await expect(
        userService.createUserAccount('Alice', 'alice@test.com', 'pass', 'USER')
      ).rejects.toThrow('already registered');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate an active user', async () => {
      const mockUser = {
        _id: 'target1',
        role: 'USER',
        isActive: true,
        save: jest.fn().mockResolvedValue({}),
        toObject: () => ({ _id: 'target1', isActive: false })
      };
      User.findById.mockResolvedValue(mockUser);

      const result = await userService.deactivateUser('target1', 'actor1', 'SUPER_ADMIN');

      expect(mockUser.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw when trying to deactivate yourself', async () => {
      await expect(
        userService.deactivateUser('user1', 'user1', 'SUPER_ADMIN')
      ).rejects.toThrow('cannot deactivate your own account');
    });

    it('should throw when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        userService.deactivateUser('nonexistent', 'actor1', 'SUPER_ADMIN')
      ).rejects.toThrow('User not found');
    });

    it('should throw when admin tries to deactivate super admin', async () => {
      User.findById.mockResolvedValue({
        _id: 'target1',
        role: 'SUPER_ADMIN',
        isActive: true
      });

      await expect(
        userService.deactivateUser('target1', 'actor1', 'ADMIN')
      ).rejects.toThrow('Admins cannot deactivate Super Admin');
    });

    it('should throw when user is already deactivated', async () => {
      User.findById.mockResolvedValue({
        _id: 'target1',
        role: 'USER',
        isActive: false
      });

      await expect(
        userService.deactivateUser('target1', 'actor1', 'SUPER_ADMIN')
      ).rejects.toThrow('already deactivated');
    });
  });

  describe('changeUserSubscription', () => {
    it('should subscribe user when action is "subscribe"', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });
      subscriptionService.subscribe.mockResolvedValue({ _id: 'sub1' });

      const result = await userService.changeUserSubscription('user1', {
        action: 'subscribe',
        planId: 'plan1',
        billingCycle: 'MONTHLY',
        months: 1
      });

      expect(result.status).toBe('CREATED');
      expect(subscriptionService.subscribe).toHaveBeenCalledWith('user1', 'plan1', 'MONTHLY', 1);
    });

    it('should cancel subscription when action is "cancel"', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });
      subscriptionService.cancelSubscription.mockResolvedValue({ _id: 'sub1', status: 'CANCELLED' });

      const result = await userService.changeUserSubscription('user1', {
        action: 'cancel',
        subscriptionId: 'sub1'
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should change subscription when action is "change"', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });
      subscriptionService.changeSubscriptionPlan.mockResolvedValue({
        subscription: { _id: 'sub2' }
      });

      const result = await userService.changeUserSubscription('user1', {
        action: 'change',
        subscriptionId: 'sub1',
        planId: 'plan2'
      });

      expect(result.status).toBe('UPDATED');
    });

    it('should throw when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        userService.changeUserSubscription('nonexistent', { action: 'subscribe', planId: 'p1' })
      ).rejects.toThrow('User not found');
    });

    it('should throw when subscribe action has no planId', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });

      await expect(
        userService.changeUserSubscription('user1', { action: 'subscribe' })
      ).rejects.toThrow('Plan ID is required');
    });

    it('should throw when cancel action has no subscriptionId', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });

      await expect(
        userService.changeUserSubscription('user1', { action: 'cancel' })
      ).rejects.toThrow('Subscription ID is required');
    });

    it('should throw when change action has no subscriptionId or planId', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' });

      await expect(
        userService.changeUserSubscription('user1', { action: 'change' })
      ).rejects.toThrow('Subscription ID and Plan ID are required');
    });
  });
});
