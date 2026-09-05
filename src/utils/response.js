/**
 * Consistent API Response Helper Functions
 */

export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
