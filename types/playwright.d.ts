/**
 * Type declarations for Playwright test environment
 * Augments the Window interface with test-specific properties used in E2E tests
 */

declare global {
  interface Window {
    // Embed customization properties
    embedCallbacks?: any;

    // Theme and view properties
    currentTheme?: string;
    currentView?: string;

    // Event tracking properties
    capturedEvents?: any[];
    receivedMessages?: any[];
    secureMessages?: any[];
    loadingEvents?: any[];

    // Widget lifecycle properties
    widgetLoaded?: boolean;
    widgetLoadedSuccessfully?: boolean;
    widgetInstanceActive?: boolean;
    widget1Loaded?: boolean;
    widget2Loaded?: boolean;
    widget3Loaded?: boolean;

    // Initialization tracking
    totalInitialized?: number;
    initializedViewers?: any[];

    // Callback and data properties
    callbackData?: any;
    errorTestResults?: any;

    // Configuration properties
    currentConfig?: any;
    updateHistory?: any[];

    // Conditional loading
    conditionalLoadingComplete?: boolean;

    // Performance tracking
    performanceMeasurements?: any;

    // Command and messaging
    sendCommand?: (command: string, data?: any) => void;

    // Search and interaction
    lastSearch?: string;
    lastClickedNode?: any;

    // Widget management
    testWidgets?: any[];

    // Compatibility testing
    compatibilityResults?: any;
  }
}

export {};
