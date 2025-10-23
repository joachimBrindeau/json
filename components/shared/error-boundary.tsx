'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;

  // Enhanced error handling options
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableErrorReporting?: boolean;
  showErrorDetails?: boolean;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'component' | 'widget';

  // Recovery options
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;

  // Custom styling
  className?: string;
  compactMode?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  showDetails: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      showDetails: false,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedErrorInfo = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
    };

    this.setState({ errorInfo: enhancedErrorInfo });

    // Log error with enhanced context
    logger.error(
      {
        err: error,
        errorId: this.state.errorId,
        errorInfo: enhancedErrorInfo,
        componentStack: errorInfo.componentStack,
      },
      'ErrorBoundary caught an error'
    );

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report error if enabled
    if (this.props.enableErrorReporting) {
      this.reportError(error, enhancedErrorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if props change (helpful for route changes)
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: 0,
        showDetails: false,
        errorId: this.generateErrorId(),
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = async (
    error: Error,
    errorInfo: ErrorInfo & { timestamp?: string; userAgent?: string; url?: string; level?: string }
  ) => {
    try {
      // This would typically send to an error tracking service
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: errorInfo.timestamp,
        userAgent: errorInfo.userAgent,
        url: errorInfo.url,
        level: errorInfo.level,
      };

      logger.info({ errorReport }, 'Error reported');

      // In a real app, you might send this to Sentry, LogRocket, etc.
      // await apiClient.post('/api/errors', errorReport);
    } catch (reportingError) {
      logger.error({ err: reportingError }, 'Failed to report error');
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      logger.warn(
        { maxRetries, retryCount: this.state.retryCount },
        'Max retries reached for ErrorBoundary'
      );
      return;
    }

    if (retryDelay > 0) {
      this.retryTimeoutId = setTimeout(() => {
        this.setState((prevState) => ({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: prevState.retryCount + 1,
          showDetails: false,
          errorId: this.generateErrorId(),
        }));
      }, retryDelay);
    } else {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
        showDetails: false,
        errorId: this.generateErrorId(),
      }));
    }
  };

  private toggleDetails = () => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  private getErrorLevel = (): 'critical' | 'error' | 'warning' => {
    const { level = 'component' } = this.props;
    switch (level) {
      case 'page':
        return 'critical';
      case 'component':
        return 'error';
      case 'widget':
        return 'warning';
      default:
        return 'error';
    }
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, showDetails } = this.state;
    const { showErrorDetails = false } = this.props;

    if (!showErrorDetails || !showDetails) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-left">
        <div className="space-y-2">
          <div>
            <strong className="text-xs text-gray-600">Error Message:</strong>
            <p className="text-xs font-mono mt-1 text-red-600">{error?.message}</p>
          </div>

          {error?.stack && (
            <div>
              <strong className="text-xs text-gray-600">Stack Trace:</strong>
              <div className="text-xs font-mono mt-1 text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                {error.stack}
              </div>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div>
              <strong className="text-xs text-gray-600">Component Stack:</strong>
              <pre className="text-xs font-mono mt-1 text-gray-700 whitespace-pre-wrap overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div className="pt-2 border-t">
            <strong className="text-xs text-gray-600">Error ID:</strong>
            <p className="text-xs font-mono mt-1 text-gray-600">{this.state.errorId}</p>
          </div>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {
        enableRetry = true,
        maxRetries = 3,
        showErrorDetails = false,
        className = '',
        compactMode = false,
      } = this.props;

      const { retryCount } = this.state;
      const errorLevel = this.getErrorLevel();
      const canRetry = enableRetry && retryCount < maxRetries;

      return (
        <Card
          role="alert"
          aria-live="polite"
          className={`h-full flex items-center justify-center ${compactMode ? 'p-4' : 'p-8'} ${className}`}
        >
          <div className={`text-center ${compactMode ? 'max-w-sm' : 'max-w-md'}`}>
            <AlertTriangle
              className={`mx-auto mb-4 text-destructive ${compactMode ? 'h-12 w-12' : 'h-16 w-16'}`}
            />

            <div className="flex items-center justify-center gap-2 mb-2">
              <h3
                className={`font-semibold text-destructive ${compactMode ? 'text-base' : 'text-lg'}`}
              >
                Something went wrong
              </h3>
              <Badge variant="destructive" className="text-xs">
                {errorLevel}
              </Badge>
            </div>

            <p className={`text-muted-foreground mb-4 ${compactMode ? 'text-xs' : 'text-sm'}`}>
              {this.state.error?.message ||
                'An unexpected error occurred while rendering this component.'}
            </p>

            {/* Retry info */}
            {retryCount > 0 && (
              <p className="text-xs text-gray-500 mb-4">
                Retry attempt: {retryCount}/{maxRetries}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {canRetry && (
                <Button onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}

              {showErrorDetails && (
                <Button variant="outline" size="sm" onClick={this.toggleDetails} className="gap-2">
                  <Bug className="h-3 w-3" />
                  {this.state.showDetails ? 'Hide' : 'Show'} Details
                  {this.state.showDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>

            {/* Error details */}
            {this.renderErrorDetails()}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
