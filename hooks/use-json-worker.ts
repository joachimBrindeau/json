'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { JsonWorkerMessage, WorkerResponse } from '@/lib/types';
import { logger } from '@/lib/logger';

interface ExtendedJsonWorkerMessage {
  type: string;
  data?: unknown;
  error?: string;
  stats?: Record<string, unknown>;
  valid?: boolean;
  position?: number;
}

interface ParseResult {
  success: boolean;
  data?: unknown;
  error?: string;
  stats?: Record<string, unknown>;
}

interface ValidationResult {
  success: boolean;
  valid?: boolean;
  error?: string;
  position?: number;
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (data: ParseResult | ValidationResult) => void>>(
    new Map()
  );

  useEffect(() => {
    // Initialize worker only in browser
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      workerRef.current = new Worker('/json-worker.js');

      workerRef.current.onmessage = (e: MessageEvent<ExtendedJsonWorkerMessage>) => {
        const { type, data, error, stats, valid } = e.data;

        // Handle different response types
        const callbacks = callbacksRef.current;

        switch (type) {
          case 'parse-success':
            callbacks.get('parse')?.({ success: true, data, stats });
            break;
          case 'parse-error':
            callbacks.get('parse')?.({ success: false, error });
            break;
          case 'stringify-success':
            callbacks.get('stringify')?.({ success: true, data, stats });
            break;
          case 'stringify-error':
            callbacks.get('stringify')?.({ success: false, error });
            break;
          case 'analyze-success':
            callbacks.get('analyze')?.({ success: true, stats });
            break;
          case 'analyze-error':
            callbacks.get('analyze')?.({ success: false, error });
            break;
          case 'validate-success':
          case 'validate-error':
            callbacks.get('validate')?.({
              success: valid || false,
              valid: valid || false,
              error,
              position: e.data.position,
            });
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        logger.error({ err: error }, 'JSON Worker error occurred');
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const parseJson = useCallback((jsonString: string): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread
        try {
          const result = JSON.parse(jsonString);
          resolve({ success: true, data: result });
        } catch (error: unknown) {
          reject({
            success: false,
            error: error instanceof Error ? error.message : 'Operation failed',
          });
        }
        return;
      }

      callbacksRef.current.set('parse', (result) => {
        callbacksRef.current.delete('parse');
        if (result.success) {
          resolve(result);
        } else {
          reject(result);
        }
      });

      workerRef.current.postMessage({
        type: 'parse',
        payload: jsonString,
      });
    });
  }, []);

  const stringifyJson = useCallback((jsonObject: unknown): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread
        try {
          const result = JSON.stringify(jsonObject, null, 2);
          resolve({ success: true, data: result });
        } catch (error: unknown) {
          reject({
            success: false,
            error: error instanceof Error ? error.message : 'Operation failed',
          });
        }
        return;
      }

      callbacksRef.current.set('stringify', (result) => {
        callbacksRef.current.delete('stringify');
        if (result.success) {
          resolve(result);
        } else {
          reject(result);
        }
      });

      workerRef.current.postMessage({
        type: 'stringify',
        payload: jsonObject,
      });
    });
  }, []);

  const validateJson = useCallback((jsonString: string): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        // Fallback to main thread
        try {
          JSON.parse(jsonString);
          resolve({ success: true, valid: true });
        } catch (error: unknown) {
          resolve({
            success: false,
            valid: false,
            error: error instanceof Error ? error.message : 'Validation failed',
          });
        }
        return;
      }

      callbacksRef.current.set('validate', (result) => {
        callbacksRef.current.delete('validate');
        resolve(result);
      });

      workerRef.current.postMessage({
        type: 'validate',
        payload: jsonString,
      });
    });
  }, []);

  const analyzeJson = useCallback((jsonString: string): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback to main thread
        try {
          const parsed = JSON.parse(jsonString);
          // Simple analysis in main thread
          resolve({
            success: true,
            stats: {
              size: jsonString.length,
              type: Array.isArray(parsed) ? 'array' : 'object',
            },
          });
        } catch (error: unknown) {
          reject({
            success: false,
            error: error instanceof Error ? error.message : 'Operation failed',
          });
        }
        return;
      }

      callbacksRef.current.set('analyze', (result) => {
        callbacksRef.current.delete('analyze');
        if (result.success) {
          resolve(result);
        } else {
          reject(result);
        }
      });

      workerRef.current.postMessage({
        type: 'analyze',
        payload: jsonString,
      });
    });
  }, []);

  return {
    parseJson,
    stringifyJson,
    validateJson,
    analyzeJson,
    isWorkerAvailable: !!workerRef.current,
  };
}
