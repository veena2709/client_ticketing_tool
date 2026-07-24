const sendResponse = (res, statusCode, success, data, message, error = null) => {
  const payload = {
    success,
    data,
    message,
    error
  };

  return res.status(statusCode).json(payload);
};

module.exports = { sendResponse };
