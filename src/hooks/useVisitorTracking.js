// hooks/useVisitorTracking.js
"use client";

import { useCallback } from 'react';

export const useVisitorTracking = () => {
  // Track custom events
  const trackEvent = useCallback((eventName, eventData = {}) => {
    if (typeof window !== 'undefined' && window.VisitorTracker) {
      window.VisitorTracker.track(eventName, eventData);
    }
  }, []);

  // Track page views (useful for SPA navigation)
  const trackPageView = useCallback((page = null) => {
    if (typeof window !== 'undefined' && window.VisitorTracker) {
      if (page) {
        // Set custom page data before tracking
        window.VisitorTrackingData = {
          ...window.VisitorTrackingData,
          customPage: page
        };
      }
      window.VisitorTracker.trackPageView();
    }
  }, []);

  // Set custom data for all future events
  const setCustomData = useCallback((data) => {
    if (typeof window !== 'undefined' && window.VisitorTracker) {
      window.VisitorTracker.setCustomData(data);
    }
  }, []);

  // Track ecommerce events
  const trackPurchase = useCallback((orderData) => {
    trackEvent('purchase', {
      orderId: orderData.id,
      total: orderData.total,
      items: orderData.items?.length || 0,
      currency: orderData.currency || 'USD',
      paymentMethod: orderData.paymentMethod
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productData) => {
    trackEvent('add_to_cart', {
      productId: productData.id,
      productName: productData.name,
      price: productData.price,
      quantity: productData.quantity || 1
    });
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((productData) => {
    trackEvent('remove_from_cart', {
      productId: productData.id,
      productName: productData.name,
      quantity: productData.quantity || 1
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchQuery, results = 0) => {
    trackEvent('search', {
      query: searchQuery,
      results: results
    });
  }, [trackEvent]);

  // Track authentication events
  const trackLogin = useCallback((method = 'email') => {
    trackEvent('login', {
      method: method,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackLogout = useCallback(() => {
    trackEvent('logout', {
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackRegistration = useCallback((method = 'email') => {
    trackEvent('registration', {
      method: method,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Track engagement events
  const trackDownload = useCallback((fileName, fileType) => {
    trackEvent('download', {
      fileName: fileName,
      fileType: fileType,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName, formData = {}) => {
    trackEvent('form_submit', {
      formName: formName,
      fields: Object.keys(formData),
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonName, location = '') => {
    trackEvent('button_click', {
      buttonName: buttonName,
      location: location,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Track content engagement
  const trackVideoPlay = useCallback((videoTitle, duration = 0) => {
    trackEvent('video_play', {
      videoTitle: videoTitle,
      duration: duration
    });
  }, [trackEvent]);

  const trackVideoComplete = useCallback((videoTitle, duration = 0) => {
    trackEvent('video_complete', {
      videoTitle: videoTitle,
      duration: duration
    });
  }, [trackEvent]);

  // Get visitor/session information
  const getVisitorId = useCallback(() => {
    if (typeof window !== 'undefined' && window.VisitorTracker) {
      return window.VisitorTracker.getVisitorId();
    }
    return null;
  }, []);

  const getSessionId = useCallback(() => {
    if (typeof window !== 'undefined' && window.VisitorTracker) {
      return window.VisitorTracker.getSessionId();
    }
    return null;
  }, []);

  // Check if tracking is available
  const isTrackingAvailable = useCallback(() => {
    return typeof window !== 'undefined' && !!window.VisitorTracker;
  }, []);

  return {
    // Core tracking functions
    trackEvent,
    trackPageView,
    setCustomData,
    
    // Ecommerce tracking
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackSearch,
    
    // Authentication tracking
    trackLogin,
    trackLogout,
    trackRegistration,
    
    // Engagement tracking
    trackDownload,
    trackFormSubmit,
    trackButtonClick,
    trackVideoPlay,
    trackVideoComplete,
    
    // Utility functions
    getVisitorId,
    getSessionId,
    isTrackingAvailable,
  };
};

export default useVisitorTracking;