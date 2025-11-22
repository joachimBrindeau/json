// JSON Viewer Embed Script - Lightweight and fast
// Automatically converts data-json-viewer elements into interactive JSON viewers

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.JsonViewerEmbed) return;

  const JsonViewerEmbed = {
    version: '1.0.0',
    baseUrl: window.JSON_VIEWER_BASE_URL || 'https://jsonviewer.app',

    // Initialize all embed elements
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.processElements());
      } else {
        this.processElements();
      }
    },

    // Process all data-json-viewer elements
    processElements() {
      const elements = document.querySelectorAll('[data-json-viewer]');
      elements.forEach((element) => this.processElement(element));
    },

    // Process a single element
    async processElement(element) {
      const shareId = element.getAttribute('data-json-viewer');
      if (!shareId) return;

      // Get configuration
      const config = {
        theme: element.getAttribute('data-theme') || 'auto',
        height: element.getAttribute('data-height') || '400',
        view: element.getAttribute('data-view') || 'smart',
        tabs: element.getAttribute('data-tabs') === 'true',
        copy: element.getAttribute('data-copy') !== 'false',
        download: element.getAttribute('data-download') === 'true',
        radius: element.getAttribute('data-radius') || '8',
      };

      // Show loading state
      element.innerHTML = this.createLoadingHTML(config);
      element.className = 'json-viewer-embed loading';

      try {
        // Fetch JSON data
        const jsonData = await this.fetchJsonData(shareId);

        // Create viewer
        const viewer = this.createViewer(shareId, jsonData, config);

        // Replace content
        element.innerHTML = viewer;
        element.className = 'json-viewer-embed loaded';

        // Initialize interactions
        this.initializeInteractions(element, shareId, jsonData, config);
      } catch (error) {
        element.innerHTML = this.createErrorHTML(error.message, config);
        element.className = 'json-viewer-embed error';
      }
    },

    // Fetch JSON data from the API
    async fetchJsonData(shareId) {
      const response = await fetch(`${this.baseUrl}/api/json/stream/${shareId}`);
      if (!response.ok) {
        throw new Error('Failed to load JSON data');
      }

      // Parse streaming response
      const reader = response.body.getReader();
      let chunks = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks += new TextDecoder().decode(value);
      }

      const lines = chunks.trim().split('\n');
      const data = lines
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((item) => item !== null);
      const reconstructed = data.length === 1 ? data[0].data : data;

      return {
        title: response.headers.get('X-Title') || 'JSON Data',
        content: reconstructed,
        jsonString: JSON.stringify(reconstructed, null, 2),
      };
    },

    // Create loading HTML
    createLoadingHTML(config) {
      return `
        <div class="json-viewer-container" style="height: ${config.height}px; border-radius: ${config.radius}px;">
          <div class="json-viewer-loading">
            <div class="json-viewer-spinner"></div>
            <span>Loading JSON...</span>
          </div>
          ${this.getStyles()}
        </div>
      `;
    },

    // Create error HTML
    createErrorHTML(message, config) {
      return `
        <div class="json-viewer-container error" style="height: ${config.height}px; border-radius: ${config.radius}px;">
          <div class="json-viewer-error">
            <div class="json-viewer-error-icon">⚠️</div>
            <div class="json-viewer-error-title">Failed to load JSON</div>
            <div class="json-viewer-error-message">${message}</div>
          </div>
          ${this.getStyles()}
        </div>
      `;
    },

    // Get contextual footer info
    getFooterInfo(jsonData) {
      const date = new Date();
      const formatDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const domain = window.location.hostname.replace('www.', '');
      const size = this.formatBytes(JSON.stringify(jsonData.content).length);
      const keys = this.countKeys(jsonData.content);

      // Create contextual, valuable anchor text variations
      const contexts = [
        `Formatted for ${domain} • ${formatDate}`,
        `${keys} fields validated • ${formatDate}`,
        `${size} JSON • Parsed ${formatDate}`,
        `Validated on ${domain} • ${formatDate}`,
        `${domain}'s JSON • ${formatDate}`,
        `Structured data for ${domain}`,
        `JSON from ${domain} • ${keys} keys`,
        `${formatDate} • ${size} formatted`,
      ];

      const seed = domain + date.getDate();
      const index = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % contexts.length;

      return {
        context: contexts[index],
        stats: `${keys} fields • ${size}`,
      };
    },

    // Count total keys in JSON
    countKeys(obj) {
      let count = 0;
      const traverse = (o) => {
        if (o && typeof o === 'object') {
          Object.keys(o).forEach((key) => {
            count++;
            traverse(o[key]);
          });
        }
      };
      traverse(obj);
      return count;
    },

    // Format bytes to human readable
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    // Create the JSON viewer HTML
    createViewer(shareId, jsonData, config) {
      const { title, jsonString } = jsonData;
      const isDark =
        config.theme === 'dark' ||
        (config.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const footerInfo = this.getFooterInfo(jsonData);

      return `
        <div class="json-viewer-container ${isDark ? 'dark' : 'light'}" 
             style="height: ${config.height}px; border-radius: ${config.radius}px;">
          
          <!-- Header -->
          <div class="json-viewer-header">
            <div class="json-viewer-title">
              <div class="json-viewer-indicator"></div>
              <span>${title}</span>
              <span class="json-viewer-badge">${this.getViewBadge(config.view, config.tabs)}</span>
            </div>
            <div class="json-viewer-actions">
              ${config.copy ? '<button class="json-viewer-btn" data-action="copy" title="Copy JSON">📋</button>' : ''}
              ${config.download ? '<button class="json-viewer-btn" data-action="download" title="Download">💾</button>' : ''}
              <button class="json-viewer-btn" data-action="fullscreen" title="Open full view">🔗</button>
            </div>
          </div>

          <!-- Content -->
          <div class="json-viewer-content">
            <pre class="json-viewer-code"><code>${this.highlightJson(jsonString)}</code></pre>
          </div>

          <!-- Footer with contextual info and natural backlink -->
          <div class="json-viewer-footer">
            <div class="json-viewer-meta">
              <span class="json-viewer-stats">${footerInfo.stats}</span>
              <span class="json-viewer-divider">•</span>
              <span class="json-viewer-context">${footerInfo.context}</span>
            </div>
            <a href="${this.baseUrl}?ref=${encodeURIComponent(window.location.hostname)}&date=${new Date().toISOString().split('T')[0]}" 
               target="_blank" 
               rel="dofollow" 
               class="json-viewer-link"
               title="Professional JSON Tools - Format, Validate, and Share">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              JSON Tools
            </a>
          </div>
        </div>
        ${this.getStyles()}
      `;
    },

    // Simple JSON syntax highlighting
    highlightJson(jsonString) {
      return jsonString
        .replace(/("([^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:')
        .replace(/:\s*("([^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
        .replace(/([{}[\]])/g, '<span class="json-punctuation">$1</span>');
    },

    // Initialize button interactions
    initializeInteractions(element, shareId, jsonData, config) {
      element.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (!action) return;

        e.preventDefault();

        switch (action) {
          case 'copy':
            this.copyToClipboard(jsonData.jsonString);
            break;
          case 'download':
            this.downloadJson(jsonData.jsonString, jsonData.title);
            break;
          case 'fullscreen':
            const fullViewParams = new URLSearchParams();
            if (config.view && config.view !== 'smart') {
              fullViewParams.set('view', config.view);
            }
            if (config.tabs) {
              fullViewParams.set('tabs', 'true');
            }
            const fullViewUrl = `${this.baseUrl}/library/${shareId}${fullViewParams.toString() ? '?' + fullViewParams.toString() : ''}`;
            window.open(fullViewUrl, '_blank');
            break;
        }
      });
    },

    // Copy to clipboard
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('✅ Copied to clipboard!');
      } catch (error) {
        this.showToast('❌ Failed to copy');
      }
    },

    // Download JSON file
    downloadJson(jsonString, title) {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // Show toast notification
    showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'json-viewer-toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('show');
      }, 10);

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 2000);
    },

    // Get view mode badge text
    getViewBadge(view, tabs) {
      if (tabs) return 'FULL';
      switch (view) {
        case 'editor':
          return 'EDITOR';
        case 'flow':
          return 'FLOW';
        case 'tree':
          return 'TREE';
        case 'list':
          return 'LIST';
        default:
          return 'JSON';
      }
    },

    // Get embed styles
    getStyles() {
      return `
        <style>
          .json-viewer-embed {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .json-viewer-container {
            border: 1px solid rgba(0, 0, 0, 0.06);
            background: linear-gradient(to bottom, #ffffff, #fafafa);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.08);
            transition: box-shadow 0.3s ease;
          }
          
          .json-viewer-container:hover {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 20px 60px rgba(0, 0, 0, 0.12);
          }
          
          .json-viewer-container.dark {
            border-color: rgba(255, 255, 255, 0.08);
            background: linear-gradient(to bottom, #1a1b26, #16171f);
            color: #e4e4e7;
          }
          
          .json-viewer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: linear-gradient(to right, rgba(59, 130, 246, 0.03), rgba(139, 92, 246, 0.03));
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(8px);
          }
          
          .json-viewer-container.dark .json-viewer-header {
            background: linear-gradient(to right, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
            border-bottom-color: rgba(255, 255, 255, 0.08);
          }
          
          .json-viewer-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            font-size: 13px;
          }
          
          .json-viewer-indicator {
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, #10b981, #34d399);
            border-radius: 50%;
            animation: pulse 2s infinite;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
          }
          
          .json-viewer-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .json-viewer-container.dark .json-viewer-badge {
            background: #4b5563;
            color: #9ca3af;
          }
          
          .json-viewer-actions {
            display: flex;
            gap: 4px;
          }
          
          .json-viewer-btn {
            background: rgba(59, 130, 246, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.1);
            padding: 5px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          
          .json-viewer-btn:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.2);
            transform: translateY(-1px);
          }
          
          .json-viewer-container.dark .json-viewer-btn:hover {
            background: #4b5563;
          }
          
          .json-viewer-content {
            flex: 1;
            overflow: auto;
            padding: 0;
          }
          
          .json-viewer-code {
            margin: 0;
            padding: 16px;
            background: rgba(250, 250, 250, 0.5);
            font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 13px;
            line-height: 1.6;
            overflow: auto;
            letter-spacing: -0.2px;
          }
          
          .json-viewer-container.dark .json-viewer-code {
            background: rgba(10, 10, 10, 0.3);
          }
          
          .json-key { color: #005cc5; font-weight: 600; }
          .json-string { color: #032f62; }
          .json-number { color: #6f42c1; font-weight: 500; }
          .json-boolean { color: #22863a; font-weight: 600; }
          .json-null { color: #6a737d; font-style: italic; }
          .json-punctuation { color: #586069; font-weight: 500; }
          
          .json-viewer-container.dark .json-key { color: #79c0ff; }
          .json-viewer-container.dark .json-string { color: #a5d6ff; }
          .json-viewer-container.dark .json-number { color: #d2a8ff; }
          .json-viewer-container.dark .json-boolean { color: #56d364; }
          .json-viewer-container.dark .json-null { color: #8b949e; }
          .json-viewer-container.dark .json-punctuation { color: #8b949e; }
          
          .json-viewer-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: linear-gradient(to top, rgba(59, 130, 246, 0.02), transparent);
            border-top: 1px solid rgba(0, 0, 0, 0.04);
            font-size: 11px;
            gap: 12px;
          }
          
          .json-viewer-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6b7280;
            font-size: 11px;
          }
          
          .json-viewer-stats {
            font-weight: 600;
            color: #4b5563;
          }
          
          .json-viewer-context {
            color: #6b7280;
          }
          
          .json-viewer-divider {
            color: #d1d5db;
          }
          
          .json-viewer-container.dark .json-viewer-meta {
            color: #9ca3af;
          }
          
          .json-viewer-container.dark .json-viewer-stats {
            color: #d1d5db;
          }
          
          .json-viewer-container.dark .json-viewer-divider {
            color: #4b5563;
          }
          
          .json-viewer-container.dark .json-viewer-footer {
            background: linear-gradient(to top, rgba(59, 130, 246, 0.05), transparent);
            border-top-color: rgba(255, 255, 255, 0.06);
          }
          
          .json-viewer-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            font-size: 11px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 6px;
            background: rgba(59, 130, 246, 0.06);
            border: 1px solid rgba(59, 130, 246, 0.1);
            transition: all 0.2s ease;
          }
          
          .json-viewer-link svg {
            opacity: 0.6;
            transition: all 0.2s ease;
          }
          
          .json-viewer-link:hover {
            background: rgba(59, 130, 246, 0.12);
            border-color: rgba(59, 130, 246, 0.2);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
          }
          
          .json-viewer-link:hover svg {
            opacity: 1;
            transform: translate(1px, -1px);
          }
          
          .json-viewer-container.dark .json-viewer-link {
            color: #60a5fa;
          }
          
          .json-viewer-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #6b7280;
            gap: 8px;
          }
          
          .json-viewer-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          .json-viewer-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 20px;
          }
          
          .json-viewer-error-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .json-viewer-error-title {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 4px;
          }
          
          .json-viewer-error-message {
            font-size: 13px;
            color: #6b7280;
          }
          
          .json-viewer-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1f2937;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 10000;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
          }
          
          .json-viewer-toast.show {
            transform: translateX(0);
            opacity: 1;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `;
    },
  };

  // Auto-initialize
  JsonViewerEmbed.init();

  // Expose globally
  window.JsonViewerEmbed = JsonViewerEmbed;

  // Manual initialization function for dynamic content
  window.initJsonViewerEmbeds = () => JsonViewerEmbed.processElements();
})();
