/**
 * Application Utilities Index
 * Centralized export for all utility functions.
 * Includes logging, error handling, and common helpers.
 */

// Logging Utilities
export { AppLogger, logger } from './logger.util';

// Error Handling Utilities
export {
  throwBadRequest,
  throwUnauthorized,
  throwForbidden,
  throwNotFound,
  throwConflict,
  throwInternalError,
  throwHttpException,
  formatErrorResponse,
} from './error.util';

/**
 * Utility Usage Guide:
 * - Logger: Use for structured application logging
 * - Error utilities: Use for consistent HTTP error handling
 * - All utilities are production-ready and fully typed
 */
