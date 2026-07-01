const { sendResponse, sendPaginatedResponse } = require('../../utils/responseHandler');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('responseHandler', () => {
  describe('sendResponse', () => {
    it('should send a JSON response with success true', () => {
      const res = createMockRes();
      sendResponse(res, 200, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: null,
        data: { id: 1 }
      });
    });

    it('should include a message when provided', () => {
      const res = createMockRes();
      sendResponse(res, 201, { id: 2 }, 'Created successfully');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
        data: { id: 2 }
      });
    });

    it('should handle null data', () => {
      const res = createMockRes();
      sendResponse(res, 200, null, 'Logged out');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out',
        data: null
      });
    });
  });

  describe('sendPaginatedResponse', () => {
    it('should send paginated response with correct metadata', () => {
      const res = createMockRes();
      sendPaginatedResponse(res, 200, [{ id: 1 }], 1, 10, 25, 'Fetched');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Fetched',
        page: 1,
        limit: 10,
        totalPages: 3,
        totalItems: 25,
        data: [{ id: 1 }]
      });
    });

    it('should calculate totalPages correctly when total is evenly divisible', () => {
      const res = createMockRes();
      sendPaginatedResponse(res, 200, [], 1, 10, 30);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalPages: 3, totalItems: 30 })
      );
    });

    it('should calculate totalPages correctly when total is not evenly divisible', () => {
      const res = createMockRes();
      sendPaginatedResponse(res, 200, [], 1, 10, 31);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalPages: 4, totalItems: 31 })
      );
    });

    it('should handle zero total items', () => {
      const res = createMockRes();
      sendPaginatedResponse(res, 200, [], 1, 10, 0);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalPages: 0, totalItems: 0 })
      );
    });
  });
});
