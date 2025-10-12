'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import LZString from 'lz-string';

interface JsonShareDB extends DBSchema {
  shares: {
    key: string;
    value: {
      id: string;
      content: string; // Compressed content
      createdAt: Date;
      title?: string;
    };
  };
  largeData: {
    key: string;
    value: {
      id: string;
      content: string; // Compressed content
      timestamp: number;
    };
  };
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBPDatabase<JsonShareDB>> | null = null;

  constructor() {
    // Only initialize in browser
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.dbPromise = this.initDB();
    }
  }

  private async initDB(): Promise<IDBPDatabase<JsonShareDB>> {
    return openDB<JsonShareDB>('json-share-db', 1, {
      upgrade(db) {
        // Create shares store
        if (!db.objectStoreNames.contains('shares')) {
          db.createObjectStore('shares', { keyPath: 'id' });
        }
        // Create large data store for current session
        if (!db.objectStoreNames.contains('largeData')) {
          db.createObjectStore('largeData', { keyPath: 'id' });
        }
      },
    });
  }

  // Ensure DB is initialized with proper error handling
  private async getDB(): Promise<IDBPDatabase<JsonShareDB>> {
    try {
      if (!this.dbPromise) {
        if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
          throw new Error('IndexedDB not available');
        }
        this.dbPromise = this.initDB();
      }
      const db = await this.dbPromise;
      // Verify the database is actually accessible
      await db.get('shares', 'test-connection');
      return db;
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
      // Reset the promise so we can try again
      this.dbPromise = null;
      // Return a mock database interface for graceful degradation
      throw error;
    }
  }

  // Compress and store large JSON
  async storeLargeJson(id: string, content: string): Promise<void> {
    try {
      const db = await this.getDB();
      const compressed = LZString.compressToUTF16(content);
      await db.put('largeData', {
        id,
        content: compressed,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to store large JSON:', error);
      throw error;
    }
  }

  // Retrieve and decompress large JSON
  async getLargeJson(id: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      const data = await db.get('largeData', id);
      if (data) {
        return LZString.decompressFromUTF16(data.content) || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get large JSON:', error);
      return null;
    }
  }

  // Store a shared JSON
  async storeShare(id: string, content: string, title?: string): Promise<void> {
    try {
      const db = await this.getDB();
      const compressed = LZString.compressToUTF16(content);
      await db.put('shares', {
        id,
        content: compressed,
        createdAt: new Date(),
        title,
      });
    } catch (error) {
      console.error('Failed to store share:', error);
      throw error;
    }
  }

  // Get a shared JSON
  async getShare(id: string): Promise<{ content: string; createdAt: Date; title?: string } | null> {
    try {
      const db = await this.getDB();
      const data = await db.get('shares', id);
      if (data) {
        const content = LZString.decompressFromUTF16(data.content);
        if (!content) return null;
        return {
          content,
          createdAt: data.createdAt,
          title: data.title,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get share:', error);
      return null;
    }
  }

  // Get all shares
  async getAllShares(): Promise<
    Array<{ id: string; createdAt: Date; title?: string; size: number; content: string }>
  > {
    try {
      const db = await this.getDB();
      const shares = await db.getAll('shares');
      return shares.map((share) => ({
        id: share.id,
        createdAt: share.createdAt,
        title: share.title,
        size: share.content.length, // Size of compressed data
        content: share.content,
      }));
    } catch (error) {
      console.error('Failed to get all shares:', error);
      return [];
    }
  }

  // Delete a share
  async deleteShare(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.delete('shares', id);
    } catch (error) {
      console.error('Failed to delete share:', error);
      throw error;
    }
  }

  // Clear old large data (cleanup)
  async clearOldLargeData(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.getDB();
      const cutoff = Date.now() - maxAge;
      const all = await db.getAll('largeData');

      for (const item of all) {
        if (item.timestamp < cutoff) {
          await db.delete('largeData', item.id);
        }
      }
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();
