const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, code = 'SERVER_ERROR') => {
  return res.status(statusCode).json({ success: false, message, code });
};

module.exports = { successResponse, errorResponse };
