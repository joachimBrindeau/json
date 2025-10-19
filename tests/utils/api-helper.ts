import { APIRequestContext, expect } from '@playwright/test';

export class APIHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * Upload JSON content via API
   */
  async uploadJSON(
    content: string | object,
    options?: {
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ) {
    const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    try {
      // Use multipart form data (as expected by the upload API)
      console.log('Uploading JSON via multipart form data');
      
      const formData = new FormData();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const fileName = (options?.title?.replace(/\s+/g, '-') || 'test-json') + '.json';
      formData.append('file', blob, fileName);
      
      if (options?.title) {
        formData.append('title', options.title);
      }

      const formResponse = await this.request.post('/api/json/upload', {
        multipart: formData,
        timeout: 60000, // 60 seconds for large file uploads
      });

      if (formResponse.ok()) {
        const result = await formResponse.json();
        console.log('✅ Upload successful:', { status: formResponse.status(), result });
        // API returns { data: { document: {...} } } structure
        return result.data?.document || result.document || result;
      } else {
        const errorText = await formResponse.text();
        console.error('❌ Upload failed:', { status: formResponse.status(), error: errorText });
        throw new Error(`Upload failed with status ${formResponse.status()}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('JSON upload failed:', error);
      throw error;
    }
  }

  /**
   * Get JSON content by ID
   */
  async getJSON(id: string) {
    const response = await this.request.get(`/api/json/${id}/content`);

    if (!response.ok()) {
      throw new Error(`Failed to get JSON ${id}: ${response.status()}`);
    }

    const result = await response.json();

    // The /content endpoint returns: { success: true, data: { success: true, document: { content: {...} } } }
    // We need to extract just the content JSON

    // Check for nested success wrapper: result.data.document.content
    if (result.data?.document?.content !== undefined) {
      return result.data.document.content;
    }

    // Check for direct document with content: result.data.document
    if (result.data?.document) {
      return result.data.document;
    }

    // Check for document at top level: result.document.content
    if (result.document?.content !== undefined) {
      return result.document.content;
    }

    // Check for document at top level without nested content
    if (result.document) {
      return result.document;
    }

    // Check for direct content: result.content
    if (result.content !== undefined) {
      return result.content;
    }

    // Fallback: return as-is
    return result;
  }

  /**
   * Update JSON title
   */
  async updateTitle(id: string, title: string) {
    const response = await this.request.patch(`/api/json/${id}/title`, {
      data: { title },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Publish JSON to public library
   */
  async publishJSON(id: string, options?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  }) {
    const response = await this.request.post(`/api/json/${id}/publish`, {
      data: {
        title: options?.title || 'Test JSON Document',
        description: options?.description,
        tags: options?.tags || [],
        category: options?.category,
      },
    });
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Analyze JSON structure
   */
  async analyzeJSON(content: string | object) {
    const jsonContent = typeof content === 'string' ? content : JSON.stringify(content);

    const response = await this.request.post('/api/json/analyze', {
      data: { content: jsonContent },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Search JSON by content
   */
  async searchJSON(query: string) {
    const response = await this.request.post('/api/json/find-by-content', {
      data: { query },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get public library entries
   */
  async getPublicLibrary(page = 1, limit = 20) {
    const response = await this.request.get('/api/library/public', {
      params: { page: page.toString(), limit: limit.toString() },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * View JSON (increment view count)
   */
  async viewJSON(id: string) {
    const response = await this.request.post(`/api/json/${id}/view`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.request.get('/api/health');
    
    if (!response.ok()) {
      throw new Error(`Health check failed: ${response.status()}`);
    }
    
    const health = await response.json();
    
    if (health.status !== 'ok') {
      throw new Error(`Health check status is not ok: ${health.status}`);
    }
    
    return health;
  }

  /**
   * Authenticate user via API
   */
  async authenticateUser(email: string, password: string) {
    try {
      // Try NextAuth credentials provider endpoint
      const csrfResponse = await this.request.get('/api/auth/csrf');
      let csrfToken = '';
      
      if (csrfResponse.ok()) {
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrfToken || '';
      }

      const response = await this.request.post('/api/auth/callback/credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          email,
          password,
          csrfToken,
          callbackUrl: '/',
          redirect: 'false',
        },
      });

      if (response.ok()) {
        // NextAuth may return different response formats
        const result = await response.text();
        if (result.includes('error')) {
          throw new Error('Authentication failed: Invalid credentials');
        }
        return { success: true, user: { email } };
      } else {
        throw new Error(`Authentication failed: ${response.status()}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Create new user account
   */
  async createUser(userData: { email: string; password: string; name?: string }) {
    const response = await this.request.post('/api/auth/signup', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: userData.name || 'Test User',
        email: userData.email,
        password: userData.password,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`User creation failed: ${response.status()} - ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Migrate anonymous session data
   */
  async migrateAnonymous(sessionId: string) {
    const response = await this.request.post('/api/auth/migrate-anonymous', {
      data: { sessionId },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Submit browser extension data
   */
  async submitExtensionData(data: { url: string; json: string | object; extensionId?: string }) {
    const response = await this.request.post('/api/extension/submit', {
      data: {
        jsonData: typeof data.json === 'string' ? data.json : JSON.stringify(data.json),
        sourceUrl: data.url,
        extensionId: data.extensionId || 'test-extension',
      },
    });

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Generic API call helper
   */
  async apiCall(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: {
      data?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
      expectedStatus?: number;
    }
  ) {
    const requestOptions: any = {};

    if (options?.data) {
      requestOptions.data = options.data;
    }

    if (options?.params) {
      requestOptions.params = options.params;
    }

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    const response = await this.request.fetch(endpoint, {
      method,
      ...requestOptions,
    });

    if (options?.expectedStatus) {
      expect(response.status()).toBe(options.expectedStatus);
    }

    return {
      status: response.status(),
      data: response.ok() ? await response.json().catch(() => null) : null,
      response,
    };
  }
}
