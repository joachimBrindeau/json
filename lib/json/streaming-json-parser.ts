'use client';

interface StreamingParserOptions {
  chunkSize?: number;
  maxDepth?: number;
  onProgress?: (progress: number, stats: ParseStats) => void;
  onNode?: (node: any, path: string[], depth: number) => void;
  signal?: AbortSignal;
}

interface ParseStats {
  bytesProcessed: number;
  totalBytes: number;
  nodesCreated: number;
  currentDepth: number;
  estimatedRemainingTime: number;
}

export class StreamingJsonParser {
  private buffer = '';
  private position = 0;
  private currentDepth = 0;
  private nodeCount = 0;
  private startTime = 0;
  private lastProgressTime = 0;

  constructor(private options: StreamingParserOptions = {}) {
    this.options = {
      chunkSize: 64 * 1024, // 64KB chunks
      maxDepth: 20,
      ...options,
    };
  }

  async parseStream(jsonString: string): Promise<{
    result: any;
    stats: ParseStats;
    truncated: boolean;
    maxDepthReached: boolean;
  }> {
    this.startTime = performance.now();
    this.buffer = jsonString;
    this.position = 0;
    this.currentDepth = 0;
    this.nodeCount = 0;

    const totalBytes = jsonString.length;
    const truncated = false;
    let maxDepthReached = false;

    try {
      const result = await this.parseValueStreaming();

      return {
        result,
        stats: this.getStats(totalBytes),
        truncated,
        maxDepthReached: this.currentDepth >= (this.options.maxDepth || 20),
      };
    } catch (error) {
      if (error instanceof MaxDepthError) {
        maxDepthReached = true;
        return {
          result: { __truncated: 'Max depth reached', __error: error.message },
          stats: this.getStats(totalBytes),
          truncated: true,
          maxDepthReached: true,
        };
      }
      throw error;
    }
  }

  private async parseValueStreaming(): Promise<any> {
    this.skipWhitespace();

    if (this.options.signal?.aborted) {
      throw new Error('Parsing aborted');
    }

    // Progress reporting every 100ms
    const now = performance.now();
    if (now - this.lastProgressTime > 100) {
      this.reportProgress();
      this.lastProgressTime = now;

      // Yield control to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const char = this.peek();

    switch (char) {
      case '{':
        return this.parseObjectStreaming();
      case '[':
        return this.parseArrayStreaming();
      case '"':
        return this.parseStringStreaming();
      case 't':
      case 'f':
        return this.parseBooleanStreaming();
      case 'n':
        return this.parseNullStreaming();
      default:
        if (this.isDigit(char) || char === '-') {
          return this.parseNumberStreaming();
        }
        throw new Error(`Unexpected character: ${char} at position ${this.position}`);
    }
  }

  private async parseObjectStreaming(): Promise<any> {
    if (this.currentDepth >= (this.options.maxDepth || 20)) {
      throw new MaxDepthError(`Max depth ${this.options.maxDepth} reached`);
    }

    this.currentDepth++;
    this.consume('{');
    this.skipWhitespace();

    const obj: any = {};
    let keyCount = 0;
    const maxKeys = 1000; // Limit object keys

    if (this.peek() === '}') {
      this.consume('}');
      this.currentDepth--;
      return obj;
    }

    while (this.position < this.buffer.length) {
      if (keyCount >= maxKeys) {
        obj.__truncated = `Object truncated after ${maxKeys} keys`;
        break;
      }

      // Parse key
      this.skipWhitespace();
      if (this.peek() !== '"') {
        throw new Error(`Expected '"' for object key at position ${this.position}`);
      }

      const key = await this.parseStringStreaming();
      this.skipWhitespace();

      if (this.peek() !== ':') {
        throw new Error(`Expected ':' after object key at position ${this.position}`);
      }
      this.consume(':');

      // Parse value
      const value = await this.parseValueStreaming();
      obj[key] = value;
      keyCount++;
      this.nodeCount++;

      // Notify about new node
      this.options.onNode?.(value, [key], this.currentDepth);

      this.skipWhitespace();

      if (this.peek() === '}') {
        break;
      } else if (this.peek() === ',') {
        this.consume(',');
      } else {
        throw new Error(`Expected ',' or '}' at position ${this.position}`);
      }
    }

    this.consume('}');
    this.currentDepth--;
    return obj;
  }

  private async parseArrayStreaming(): Promise<any[]> {
    if (this.currentDepth >= (this.options.maxDepth || 20)) {
      throw new MaxDepthError(`Max depth ${this.options.maxDepth} reached`);
    }

    this.currentDepth++;
    this.consume('[');
    this.skipWhitespace();

    const arr: any[] = [];
    let itemCount = 0;
    const maxItems = 10000; // Limit array items

    if (this.peek() === ']') {
      this.consume(']');
      this.currentDepth--;
      return arr;
    }

    while (this.position < this.buffer.length) {
      if (itemCount >= maxItems) {
        arr.push({ __truncated: `Array truncated after ${maxItems} items` });
        break;
      }

      const value = await this.parseValueStreaming();
      arr.push(value);
      itemCount++;
      this.nodeCount++;

      // Notify about new node
      this.options.onNode?.(value, [itemCount.toString()], this.currentDepth);

      this.skipWhitespace();

      if (this.peek() === ']') {
        break;
      } else if (this.peek() === ',') {
        this.consume(',');
      } else {
        throw new Error(`Expected ',' or ']' at position ${this.position}`);
      }
    }

    this.consume(']');
    this.currentDepth--;
    return arr;
  }

  private async parseStringStreaming(): Promise<string> {
    this.consume('"');
    let result = '';

    while (this.position < this.buffer.length) {
      const char = this.peek();

      if (char === '"') {
        this.consume('"');
        return result;
      } else if (char === '\\') {
        this.advance();
        const escaped = this.peek();

        switch (escaped) {
          case '"':
          case '\\':
          case '/':
            result += escaped;
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'u':
            // Unicode escape
            this.advance();
            const hex = this.buffer.substring(this.position, this.position + 4);
            result += String.fromCharCode(parseInt(hex, 16));
            this.position += 3; // Will advance by 1 more at end of loop
            break;
          default:
            throw new Error(`Invalid escape sequence \\${escaped} at position ${this.position}`);
        }
        this.advance();
      } else {
        result += char;
        this.advance();
      }

      // Prevent extremely long strings from blocking
      if (result.length > 100000) {
        result += '... (truncated)';
        // Skip to end of string
        while (this.position < this.buffer.length && this.peek() !== '"') {
          this.advance();
        }
        if (this.peek() === '"') {
          this.consume('"');
        }
        return result;
      }
    }

    throw new Error('Unterminated string');
  }

  private parseNumberStreaming(): number {
    const start = this.position;

    if (this.peek() === '-') {
      this.advance();
    }

    if (!this.isDigit(this.peek())) {
      throw new Error(`Invalid number at position ${this.position}`);
    }

    // Integer part
    if (this.peek() === '0') {
      this.advance();
    } else {
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Decimal part
    if (this.peek() === '.') {
      this.advance();
      if (!this.isDigit(this.peek())) {
        throw new Error(`Invalid number at position ${this.position}`);
      }
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Exponent part
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance();
      }
      if (!this.isDigit(this.peek())) {
        throw new Error(`Invalid number at position ${this.position}`);
      }
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const numberStr = this.buffer.substring(start, this.position);
    return parseFloat(numberStr);
  }

  private parseBooleanStreaming(): boolean {
    if (this.buffer.substring(this.position, this.position + 4) === 'true') {
      this.position += 4;
      return true;
    } else if (this.buffer.substring(this.position, this.position + 5) === 'false') {
      this.position += 5;
      return false;
    }
    throw new Error(`Invalid boolean at position ${this.position}`);
  }

  private parseNullStreaming(): null {
    if (this.buffer.substring(this.position, this.position + 4) === 'null') {
      this.position += 4;
      return null;
    }
    throw new Error(`Invalid null at position ${this.position}`);
  }

  // Helper methods
  private peek(): string {
    return this.buffer[this.position] || '';
  }

  private advance(): void {
    this.position++;
  }

  private consume(expected: string): void {
    if (this.peek() !== expected) {
      throw new Error(`Expected '${expected}' at position ${this.position}, got '${this.peek()}'`);
    }
    this.advance();
  }

  private skipWhitespace(): void {
    while (this.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private reportProgress(): void {
    const stats = this.getStats(this.buffer.length);
    this.options.onProgress?.((this.position / this.buffer.length) * 100, stats);
  }

  private getStats(totalBytes: number): ParseStats {
    const elapsed = performance.now() - this.startTime;
    const bytesPerMs = this.position / elapsed;
    const remainingBytes = totalBytes - this.position;
    const estimatedRemainingTime = remainingBytes / bytesPerMs;

    return {
      bytesProcessed: this.position,
      totalBytes,
      nodesCreated: this.nodeCount,
      currentDepth: this.currentDepth,
      estimatedRemainingTime: estimatedRemainingTime || 0,
    };
  }
}

class MaxDepthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MaxDepthError';
  }
}
