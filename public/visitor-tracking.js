(function() {
  'use strict';

  // Configuration
  const config = {
    apiEndpoint: '/api/web-stats',
    autoTrack: true,
    trackPageViews: true,
    trackUserAgent: true,
    trackScreenSize: true,
    trackReferrer: true,
    trackTimezone: true,
    trackLanguage: true,
    trackPerformance: true,
    debounceTime: 100,
    maxRetries: 3,
    timeout: 5000
  };

  // Global configuration override
  if (typeof window.VisitorTrackingConfig !== 'undefined') {
    Object.assign(config, window.VisitorTrackingConfig);
  }

  // Utility functions
  const utils = {
    // Generate unique session ID
    generateSessionId: function() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Get or create visitor ID (stored in localStorage)
    getVisitorId: function() {
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
      }
      return visitorId;
    },

    // Get session ID (stored in sessionStorage)
    getSessionId: function() {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    },

    // Debounce function
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = function() {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Get screen size
    getScreenSize: function() {
      return {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      };
    },

    // Get viewport size
    getViewportSize: function() {
      return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
      };
    },

    // Get device info
    getDeviceInfo: function() {
      const viewport = this.getViewportSize();
      const screen = this.getScreenSize();
      
      return {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
        isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        screen: screen,
        viewport: viewport,
        orientation: screen.orientation ? screen.orientation.type : (screen.width > screen.height ? 'landscape' : 'portrait'),
        pixelRatio: window.devicePixelRatio || 1
      };
    },

    // Get performance data
    getPerformanceData: function() {
      if (!window.performance || !window.performance.timing) {
        return null;
      }

      const timing = window.performance.timing;
      const navigation = window.performance.navigation;
      
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        redirectTime: timing.redirectEnd - timing.redirectStart,
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        connectTime: timing.connectEnd - timing.connectStart,
        responseTime: timing.responseEnd - timing.requestStart,
        renderTime: timing.loadEventEnd - timing.responseEnd,
        navigationType: navigation.type,
        redirectCount: navigation.redirectCount
      };
    },

    // Get connection info (if available)
    getConnectionInfo: function() {
      if (!navigator.connection) {
        return null;
      }

      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    },

    // Get URL parameters
    getUrlParams: function() {
      const params = {};
      const searchParams = new URLSearchParams(window.location.search);
      for (const [key, value] of searchParams) {
        params[key] = value;
      }
      return params;
    }
  };

  // Main tracking class
  class VisitorTracker {
    constructor() {
      this.visitorId = utils.getVisitorId();
      this.sessionId = utils.getSessionId();
      this.pageLoadTime = Date.now();
      this.retryCount = 0;
      this.isTracking = false;
      
      // Bind methods
      this.trackPageView = utils.debounce(this.trackPageView.bind(this), config.debounceTime);
      this.trackEvent = utils.debounce(this.trackEvent.bind(this), config.debounceTime);
      
      this.init();
    }

    init() {
      if (config.autoTrack && config.trackPageViews) {
        this.trackPageView();
      }

      // Track page unload
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
      
      // Track visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      // Track hash changes (SPA navigation)
      window.addEventListener('hashchange', this.handleHashChange.bind(this));
      
      // Track popstate (browser navigation)
      window.addEventListener('popstate', this.handlePopstate.bind(this));
    }

    collectData() {
      const now = Date.now();
      const data = {
        // Basic identifiers
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        
        // Page information
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        
        // Referrer information
        referrer: config.trackReferrer ? document.referrer : null,
        
        // User agent (will be parsed server-side)
        userAgent: config.trackUserAgent ? navigator.userAgent : null,
        
        // Language and locale
        language: config.trackLanguage ? (navigator.language || navigator.userLanguage) : null,
        languages: config.trackLanguage ? navigator.languages : null,
        
        // Timezone
        timezone: config.trackTimezone ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
        timezoneOffset: config.trackTimezone ? new Date().getTimezoneOffset() : null,
        
        // Device and screen information
        device: config.trackScreenSize ? utils.getDeviceInfo() : null,
        
        // Performance data
        performance: config.trackPerformance ? utils.getPerformanceData() : null,
        
        // Connection info
        connection: utils.getConnectionInfo(),
        
        // URL parameters
        params: utils.getUrlParams(),
        
        // Timestamps
        timestamp: now,
        pageLoadTime: this.pageLoadTime,
        timeOnPage: now - this.pageLoadTime,
        
        // Additional metadata
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === '1',
        
        // Custom data
        customData: window.VisitorTrackingData || {}
      };

      return data;
    }

    async sendData(data, eventType = 'pageview') {
      if (this.isTracking) return; // Prevent duplicate requests
      
      this.isTracking = true;
      
      try {
        const payload = {
          type: eventType,
          ...data
        };

        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
          signal: AbortSignal.timeout(config.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.retryCount = 0; // Reset retry count on success
        
        // Trigger success callback if defined
        if (typeof window.onVisitorTrackingSuccess === 'function') {
          window.onVisitorTrackingSuccess(payload);
        }
        
      } catch (error) {
        console.warn('Visitor tracking failed:', error.message);
        
        // Retry logic
        if (this.retryCount < config.maxRetries && !error.name === 'AbortError') {
          this.retryCount++;
          setTimeout(() => {
            this.isTracking = false;
            this.sendData(data, eventType);
          }, 1000 * this.retryCount);
        } else {
          // Trigger error callback if defined
          if (typeof window.onVisitorTrackingError === 'function') {
            window.onVisitorTrackingError(error, payload);
          }
        }
      } finally {
        this.isTracking = false;
      }
    }

    trackPageView() {
      const data = this.collectData();
      this.sendData(data, 'pageview');
      
      // Update page load time for time tracking
      this.pageLoadTime = Date.now();
    }

    trackEvent(eventName, eventData = {}) {
      const data = {
        ...this.collectData(),
        eventName,
        eventData
      };
      this.sendData(data, 'event');
    }

    trackCustomEvent(customData = {}) {
      const data = {
        ...this.collectData(),
        customData: {
          ...this.collectData().customData,
          ...customData
        }
      };
      this.sendData(data, 'custom');
    }

    handlePageUnload() {
      // Track page unload with minimal data
      const data = {
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        url: window.location.href,
        timeOnPage: Date.now() - this.pageLoadTime,
        timestamp: Date.now()
      };
      
      // Use sendBeacon for reliable unload tracking
      if (navigator.sendBeacon) {
        navigator.sendBeacon(config.apiEndpoint, JSON.stringify({
          type: 'unload',
          ...data
        }));
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    }

    handleHashChange() {
      this.trackPageView();
    }

    handlePopstate() {
      this.trackPageView();
    }

    // Public methods
    track(eventName, eventData) {
      this.trackEvent(eventName, eventData);
    }

    setCustomData(data) {
      window.VisitorTrackingData = {
        ...window.VisitorTrackingData,
        ...data
      };
    }

    getVisitorId() {
      return this.visitorId;
    }

    getSessionId() {
      return this.sessionId;
    }
  }

  // Initialize tracker when DOM is ready
  function initTracker() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.VisitorTracker = new VisitorTracker();
      });
    } else {
      window.VisitorTracker = new VisitorTracker();
    }
  }

  // Auto-initialize unless disabled
  if (config.autoTrack !== false) {
    initTracker();
  }

  // Export for manual initialization
  window.VisitorTracking = {
    init: initTracker,
    VisitorTracker: VisitorTracker,
    config: config,
    utils: utils
  };

})();