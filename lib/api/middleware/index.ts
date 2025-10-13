/**
 * API middleware exports
 */

export {
  withErrorHandler,
  withValidationHandler,
  withDatabaseHandler,
  createErrorHandler,
  composeErrorHandlers,
  errorBoundary,
  catchAllErrors,
  type ApiRouteHandler,
  type ErrorHandlerOptions,
} from './error-handler';
