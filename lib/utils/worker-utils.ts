'use client';

import type { WorkerResponse } from '@/lib/types';
import { logger } from '@/lib/logger';

// Common worker callback handler patterns

export type WorkerCallback<T = unknown> = (response: WorkerResponse<T>) => void;

// Worker stats interface for type safety
interface WorkerStats {
  duration?: number;
  memoryUsage?: number;
  [key: string]: unknown;
}

// Create standardized success/error response handlers
export const createWorkerResponseHandler = <T = unknown>(callback: WorkerCallback<T>) => ({
  success: (data: T, stats?: WorkerStats) => callback({ success: true, data, stats }),
  error: (error: string) => callback({ success: false, error }),
});

// Worker message event interface
interface WorkerMessageData {
  type: string;
  data?: unknown;
  error?: string;
  stats?: WorkerStats;
  valid?: boolean;
}

// Generic worker message handler factory
export const createWorkerMessageHandler =
  (callbacks: Map<string, WorkerCallback>) =>
  (e: MessageEvent<WorkerMessageData>) => {
    const { type, data, error, stats, valid } = e.data;

    // Extract operation name from message type (e.g., 'parse-success' -> 'parse')
    const operationMatch = type.match(/^(\w+)-(success|error)$/);
    if (!operationMatch) return;

    const [, operation, result] = operationMatch;
    const callback = callbacks.get(operation);

    if (!callback) return;

    if (result === 'success') {
      callback({ success: true, data, stats, valid });
    } else {
      callback({ success: false, error });
    }
  };

// Worker task queue management
export class WorkerTaskQueue {
  private queue: Array<{ id: string; task: () => void; cleanup?: () => void }> = [];
  private processing = false;

  add(id: string, task: () => void, cleanup?: () => void) {
    // Remove existing task with same ID
    this.remove(id);
    this.queue.push({ id, task, cleanup });
    this.process();
  }

  remove(id: string) {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index >= 0) {
      const item = this.queue.splice(index, 1)[0];
      item.cleanup?.();
    }
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        try {
          item.task();
        } catch (error) {
          logger.error({ err: error, taskId: item.id }, 'Worker task failed');
        }
      }
    }
    this.processing = false;
  }

  clear() {
    this.queue.forEach((item) => item.cleanup?.());
    this.queue = [];
  }
}
