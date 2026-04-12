/**
 * Request Validation Middleware
 * Reusable validators for common request patterns
 */

import logger from '../../../utils/logger.js';

/**
 * Validate required query parameters
 */
export const validateQuery = (requiredParams) => {
  return (req, res, next) => {
    const missing = requiredParams.filter(param => !req.query[param]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required query parameters',
        missing,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Validate required body parameters
 */
export const validateBody = (requiredParams) => {
  return (req, res, next) => {
    const missing = requiredParams.filter(param => req.body[param] === undefined);

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required body parameters',
        missing,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Validate machine ID format
 */
export const validateMachineId = (req, res, next) => {
  const machineId = req.params.id || req.query.machineId || req.body.machineId;

  if (!machineId) {
    return res.status(400).json({
      error: 'Machine ID is required',
      timestamp: new Date().toISOString()
    });
  }

  if (typeof machineId !== 'string' || machineId.trim().length === 0) {
    return res.status(400).json({
      error: 'Machine ID must be a non-empty string',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validate date range
 */
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      error: 'startDate and endDate are required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format (use ISO 8601)',
        example: '2024-01-15T00:00:00Z',
        timestamp: new Date().toISOString()
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'startDate must be before endDate',
        timestamp: new Date().toISOString()
      });
    }

    // Attach parsed dates to req for use in handlers
    req.parsedDates = { start, end };
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to parse dates',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { limit = 10, offset = 0 } = req.query;

  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);

  if (isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({
      error: 'limit must be a positive integer',
      timestamp: new Date().toISOString()
    });
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      error: 'offset must be a non-negative integer',
      timestamp: new Date().toISOString()
    });
  }

  if (limitNum > 100) {
    return res.status(400).json({
      error: 'limit cannot exceed 100',
      timestamp: new Date().toISOString()
    });
  }

  // Attach parsed values to req
  req.pagination = { limit: limitNum, offset: offsetNum };
  next();
};

/**
 * Validate numeric value
 */
export const validateNumeric = (field) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (value === undefined) {
      return res.status(400).json({
        error: `${field} is required`,
        timestamp: new Date().toISOString()
      });
    }

    if (typeof value !== 'number' || isNaN(value)) {
      return res.status(400).json({
        error: `${field} must be a number`,
        timestamp: new Date().toISOString()
      });
    }

    if (value <= 0) {
      return res.status(400).json({
        error: `${field} must be positive`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Validate enum value
 */
export const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (value === undefined) {
      return res.status(400).json({
        error: `${field} is required`,
        timestamp: new Date().toISOString()
      });
    }

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        error: `${field} must be one of: ${allowedValues.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};
