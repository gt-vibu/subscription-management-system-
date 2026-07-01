const userController = require('../../controllers/userController');
const userService = require('../../services/userService');
const AppError = require('../../utils/appError');

jest.mock('../../services/userService');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userController', () => {
  describe('getUsersList', () => {
    it('should return paginated user list with defaults', async () => {
      const req = { query: {} };
      const res = createMockRes();
      const next = jest.fn();

      userService.getUsers.mockResolvedValue({ users: [{ name: 'Alice' }], total: 1 });

      await userController.getUsersList(req, res, next);

      expect(userService.getUsers).toHaveBeenCalledWith('', 1, 10, '', '', 'asc');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should pass query params to service', async () => {
      const req = { query: { search: 'john', page: '2', limit: '5', role: 'ADMIN', sortBy: 'name', sortOrder: 'desc' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.getUsers.mockResolvedValue({ users: [], total: 0 });

      await userController.getUsersList(req, res, next);

      expect(userService.getUsers).toHaveBeenCalledWith('john', 2, 5, 'ADMIN', 'name', 'desc');
    });

    it('should include pagination metadata in response', async () => {
      const req = { query: {} };
      const res = createMockRes();
      const next = jest.fn();

      userService.getUsers.mockResolvedValue({ users: [], total: 25 });

      await userController.getUsersList(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          totalPages: 3,
          totalItems: 25
        })
      );
    });
  });

  describe('changeUserRole', () => {
    it('should change user role and return result', async () => {
      const req = { params: { id: 'target1' }, body: { role: 'ADMIN' }, user: { _id: 'actor1' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.changeRole.mockResolvedValue({ _id: 'target1', role: 'ADMIN' });

      await userController.changeUserRole(req, res, next);

      expect(userService.changeRole).toHaveBeenCalledWith('target1', 'ADMIN', 'actor1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error when role is not specified', async () => {
      const req = { params: { id: 'target1' }, body: {}, user: { _id: 'actor1' } };
      const res = createMockRes();
      const next = jest.fn();

      await userController.changeUserRole(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success', async () => {
      const req = { params: { id: 'target1' }, user: { _id: 'actor1' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.deleteUser.mockResolvedValue({ id: 'target1' });

      await userController.deleteUser(req, res, next);

      expect(userService.deleteUser).toHaveBeenCalledWith('target1', 'actor1');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = { params: { id: 'target1' }, user: { _id: 'actor1' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.deleteUser.mockRejectedValue(new AppError('Cannot delete', 400));

      await userController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createUser', () => {
    it('should create a user with all required fields', async () => {
      const req = {
        body: { name: 'Alice', email: 'alice@test.com', password: 'Password1!', role: 'ADMIN' }
      };
      const res = createMockRes();
      const next = jest.fn();

      userService.createUserAccount.mockResolvedValue({ _id: 'new1', name: 'Alice', role: 'ADMIN' });

      await userController.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error when required fields are missing', async () => {
      const req = { body: { name: 'Alice' } };
      const res = createMockRes();
      const next = jest.fn();

      await userController.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error for invalid role', async () => {
      const req = {
        body: { name: 'Alice', email: 'a@b.com', password: 'Password1!', role: 'INVALID' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await userController.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return error for weak password', async () => {
      const req = {
        body: { name: 'Alice', email: 'a@b.com', password: 'weak', role: 'USER' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await userController.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateUserSubscription', () => {
    it('should update user subscription', async () => {
      const req = {
        params: { id: 'user1' },
        body: { action: 'subscribe', planId: 'plan1', billingCycle: 'MONTHLY' }
      };
      const res = createMockRes();
      const next = jest.fn();

      userService.changeUserSubscription.mockResolvedValue({ status: 'CREATED' });

      await userController.updateUserSubscription(req, res, next);

      expect(userService.changeUserSubscription).toHaveBeenCalledWith('user1', expect.objectContaining({
        action: 'subscribe',
        planId: 'plan1'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const req = { params: { id: 'target1' }, user: { _id: 'actor1', role: 'SUPER_ADMIN' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.deactivateUser.mockResolvedValue({ _id: 'target1', isActive: false });

      await userController.deactivateUser(req, res, next);

      expect(userService.deactivateUser).toHaveBeenCalledWith('target1', 'actor1', 'SUPER_ADMIN');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward errors to next', async () => {
      const req = { params: { id: 'target1' }, user: { _id: 'actor1', role: 'ADMIN' } };
      const res = createMockRes();
      const next = jest.fn();

      userService.deactivateUser.mockRejectedValue(new AppError('Cannot deactivate', 403));

      await userController.deactivateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
