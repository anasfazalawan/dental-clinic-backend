import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}. Check /api/health or documentation for valid endpoints.`,
    404
  );
};
