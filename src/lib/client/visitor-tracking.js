// @/lib/client/visitor-tracking.js
'use client';

let isInitialized = false;
let visitorTracker = null;
let sessionStartTime = null;

// Utility functions
const utils = {
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  getVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  },

  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('session_id', sessionId);
      sessionStartTime = Date.now();
      sessionStorage.setItem('session_start_time', sessionStartTime.toString());
    } else {
      sessionStartTime = parseInt(sessionStorage.getItem('session_start_time')) || Date.now();
    }
    return sessionId;
  },

  getDeviceInfo() {
    const viewport = {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
    
    const screenInfo = {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    };
    
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screen: screenInfo,
      viewport,
      orientation: window.screen.orientation ? window.screen.orientation.type : (window.screen.width > window.screen.height ? 'landscape' : 'portrait'),
      pixelRatio: window.devicePixelRatio || 1
    };
  },

  getPerformanceData() {
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

  getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

class VisitorTracker {
  constructor() {
    // Prevent multiple instances
    if (window.VisitorTrackerInstance) { 
      return window.VisitorTrackerInstance;
    }
     
    window.VisitorTrackerInstance = this;
    
    this.visitorId = utils.getVisitorId();
    this.sessionId = utils.getSessionId();
    this.pageLoadTime = Date.now();
    this.lastPageView = null;
    this.isTracking = false;
    this.trackedPages = new Set(); // Track which pages we've already tracked in this session
    
    // Get the current page key for this session
    this.currentPageKey = `${this.sessionId}_${window.location.pathname}`;
    
    // Bind methods first, then debounce
    this.trackPageView = this.trackPageView.bind(this);
    this.trackEvent = this.trackEvent.bind(this);
    
    // Create debounced versions for navigation events
    this.debouncedTrackPageView = utils.debounce(this.trackPageView, 1000);
    this.debouncedTrackEvent = utils.debounce(this.trackEvent, 500);
    
    this.init();
  }

  init() { 
    
    try {
      // Check if we've tracked this exact page in this session
      const trackingKey = `tracked_${this.currentPageKey}`;
      let hasTrackedThisPage = false;
      
      try {
        hasTrackedThisPage = sessionStorage.getItem(trackingKey);
      } catch (storageError) {
        console.warn('SessionStorage not available, using memory tracking');
        hasTrackedThisPage = this.trackedPages.has(this.currentPageKey);
      } 
      
      if (!hasTrackedThisPage) {
        // Mark this page as tracked for this session
        try {
          sessionStorage.setItem(trackingKey, 'true');
        } catch (storageError) {
          console.warn('SessionStorage write failed, using memory tracking');
          this.trackedPages.add(this.currentPageKey);
        } 
        
        // Force immediate tracking for testing 
        this.trackPageView();
        
      } 
    } catch (error) {
      console.error('Error in init():', error);
      // Fallback: always track if there's an error 
      this.trackPageView();
    }

    // Set up event listeners for navigation
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Track hash changes (SPA navigation)
    window.addEventListener('hashchange', () => {
      this.handleNavigation();
    });
    
    // Track popstate (browser navigation)
    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - could be a return from another tab
        // Don't track as new page view 
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });
  }

  handleNavigation() {
    const newPageKey = `${this.sessionId}_${window.location.pathname}`;
    
    // Only track if it's a different page
    if (newPageKey !== this.currentPageKey) {
      this.currentPageKey = newPageKey;
      
      const hasTrackedNewPage = sessionStorage.getItem(`tracked_${newPageKey}`);
      if (!hasTrackedNewPage) {
        sessionStorage.setItem(`tracked_${newPageKey}`, 'true');
        this.pageLoadTime = Date.now(); // Reset page load time for new page
        // Use debounced version for navigation
        this.debouncedTrackPageView();
      }
    }
  }

  collectData() {
    const now = Date.now();
    
    return {
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
      referrer: document.referrer,
      
      // User agent
      userAgent: navigator.userAgent,
      
      // Language and timezone
      language: navigator.language || navigator.userLanguage,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Device info
      device: utils.getDeviceInfo(),
      
      // Performance data
      performance: utils.getPerformanceData(),
      
      // URL parameters
      params: utils.getUrlParams(),
      
      // Timing data
      timestamp: now,
      pageLoadTime: this.pageLoadTime,
      timeOnPage: now - this.pageLoadTime,
      
      // Browser capabilities
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      
      // Custom data
      customData: window.VisitorTrackingData || {}
    };
  }

  async sendData(data, eventType = 'pageview') {
    // Prevent duplicate requests
    if (this.isTracking) { 
      return;
    }
     
    this.isTracking = true;
    
    try {
      const requestData = {
        ...data,
        type: eventType
      }; 
      
      const response = await fetch('/api/web-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) { 
        
        // Call success callback if available
        if (typeof window.onVisitorTrackingSuccess === 'function') {
          window.onVisitorTrackingSuccess(result);
        }
      } else {
        throw new Error(result.message || 'Failed to record visitor data');
      }
      
    } catch (error) {
      console.error('Failed to send visitor data:', error);
      
      // Call error callback if available
      if (typeof window.onVisitorTrackingError === 'function') {
        window.onVisitorTrackingError(error, data);
      }
    } finally {
      this.isTracking = false;
    }
  }

  trackPageView() {
    const now = Date.now(); 
    
    // Prevent tracking the same page too frequently
    if (this.lastPageView && (now - this.lastPageView) < 2000) { 
      return;
    }
    
    this.lastPageView = now;
    const data = this.collectData(); 
    this.sendData(data, 'pageview');
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
    // Track page unload with minimal data using sendBeacon if available
    const data = {
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      url: window.location.href,
      timeOnPage: Date.now() - this.pageLoadTime,
      timestamp: Date.now()
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/web-stats', JSON.stringify({
        ...data,
        type: 'unload'
      }));
    }
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

// Initialize visitor tracking
export const initializeVisitorTracking = () => { 
  
  // Ensure we're in the browser environment
  if (typeof window === 'undefined') { 
    return Promise.reject(new Error('Not in browser environment'));
  }
  
  if (isInitialized) {
    console.log('Visitor tracking already initialized');
    return Promise.resolve(visitorTracker);
  }

  try { 
    visitorTracker = new VisitorTracker();
    isInitialized = true;
    
    // Make tracker globally available
    window.VisitorTracker = visitorTracker;
    window.VisitorTrackingInitialized = true;
     
    return Promise.resolve(visitorTracker);
    
  } catch (error) { 
    return Promise.reject(error);
  }
};

export const isVisitorTrackingInitialized = () => {
  return isInitialized;
};

export const getVisitorTracker = () => {
  return visitorTracker;
};