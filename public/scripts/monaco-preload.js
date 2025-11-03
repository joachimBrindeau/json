// Monaco Editor Preloader - speeds up initial load
(function () {
  'use strict';

  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Check if we should preload (not on mobile)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  if (isMobile) return;

  // Preload Monaco Editor assets
  const preloadMonaco = () => {
    // Monaco CDN URLs (update version as needed)
    const monacoVersion = '0.45.0';
    const monacoBase = `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/min/vs`;

    // Core Monaco files to preload
    const monacoFiles = [
      '/loader.js',
      '/editor/editor.main.js',
      '/editor/editor.main.css',
      '/base/worker/workerMain.js',
      '/language/json/jsonWorker.js',
    ];

    // Preload JS files
    monacoFiles.forEach((file) => {
      if (file.endsWith('.js')) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'script';
        link.href = monacoBase + file;
        document.head.appendChild(link);
      } else if (file.endsWith('.css')) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'style';
        link.href = monacoBase + file;
        document.head.appendChild(link);
      }
    });

    // Preload Web Worker for JSON
    if ('Worker' in window) {
      const workerBlob = new Blob(
        [
          `
        // Pre-initialize JSON worker
        self.importScripts('${monacoBase}/base/worker/workerMain.js');
      `,
        ],
        { type: 'application/javascript' }
      );

      const workerUrl = URL.createObjectURL(workerBlob);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = workerUrl;
      document.head.appendChild(link);
    }
  };

  // Start preloading after page load
  if (document.readyState === 'complete') {
    setTimeout(preloadMonaco, 100);
  } else {
    window.addEventListener('load', () => {
      setTimeout(preloadMonaco, 100);
    });
  }

  // Cache Monaco settings in localStorage for faster subsequent loads
  const cacheMonacoSettings = () => {
    const settings = {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      fontSize: 14,
      wordWrap: 'off',
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('monaco-settings-cache', JSON.stringify(settings));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  // Cache settings on theme change
  const observer = new MutationObserver(cacheMonacoSettings);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  cacheMonacoSettings();
})();
