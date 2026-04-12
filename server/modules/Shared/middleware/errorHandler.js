/**
 * Error Handler Middleware
 * Centralized error handling and response formatting
 */

import logger from '../../../utils/logger.js';

/**
 * Global error handler middleware
 * Should be registered last in middleware stack
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`❌ Error: ${err.message}`);
  if (err.stack) {
    logger.error(`Stack: ${err.stack}`);
  }

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  if (![400, 401, 403, 404, 422, 429, 500, 503].includes(statusCode)) {
    statusCode = 500;
  }

  // Format error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.details;
    errorResponse.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
};
