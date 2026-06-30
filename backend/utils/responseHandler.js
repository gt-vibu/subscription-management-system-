const sendResponse = (res, statusCode, data, message = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendPaginatedResponse = (res, statusCode, data, page, limit, total, message = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    data
  });
};

module.exports = {
  sendResponse,
  sendPaginatedResponse
};
