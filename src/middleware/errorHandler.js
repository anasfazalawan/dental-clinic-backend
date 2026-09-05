import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Prisma Unique Constraint Violation (P2002)
  if (err.code === 'P2002') {
    const targets = err.meta?.target || ['field'];
    return sendError(
      res,
      `A record with this ${Array.isArray(targets) ? targets.join(', ') : targets} already exists.`,
      409,
      { prismaCode: err.code, targets }
    );
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return sendError(
      res,
      err.meta?.cause || 'The requested record was not found in the database.',
      404,
      { prismaCode: err.code }
    );
  }

  // Prisma Foreign Key Constraint Failure (P2003)
  if (err.code === 'P2003') {
    return sendError(
      res,
      'Foreign key constraint failed. Related record does not exist or cannot be deleted while referenced.',
      400,
      { prismaCode: err.code, field: err.meta?.field_name }
    );
  }

  // Syntax error / JSON parse error in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON payload in request body', 400);
  }

  // General server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};
