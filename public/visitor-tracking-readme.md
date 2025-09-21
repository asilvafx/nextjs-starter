# Visitor Tracking Script

A comprehensive visitor tracking script that can be used on the same host or external hosts to collect detailed analytics data.

## Features

- 🔍 **Comprehensive Data Collection**: Page views, user agents, device info, performance metrics
- 🌐 **Cross-Origin Support**: Works on same host or external domains
- 📱 **Device Detection**: Mobile, tablet, desktop detection with screen/viewport info
- ⚡ **Performance Tracking**: Load times, DNS resolution, render times
- 🔄 **SPA Support**: Tracks hash changes and browser navigation
- 🎯 **Event Tracking**: Custom events and user interactions
- 💾 **Persistent Tracking**: Visitor and session IDs with localStorage/sessionStorage
- 🚀 **Optimized**: Debounced requests, retry logic, timeout handling
- 🛡️ **Privacy Aware**: Respects DNT headers, configurable data collection

## Installation

### Option 1: Same Host Usage

Add the script to your HTML page:

```html
<!-- Basic usage -->
<script src="/visitor-tracking.js"></script>

<!-- With custom configuration -->
<script>
window.VisitorTrackingConfig = {
  apiEndpoint: '/api/web-stats',
  trackPerformance: true,
  trackScreenSize: true
};
</script>
<script src="/visitor-tracking.js"></script>
```

### Option 2: External Host Usage

```html
<!-- For external sites -->
<script>
window.VisitorTrackingConfig = {
  apiEndpoint: 'https://yourdomain.com/api/web-stats',
  trackPerformance: true,
  trackScreenSize: true,
  trackUserAgent: true
};
</script>
<script src="https://yourdomain.com/visitor-tracking.js"></script>
```

### Option 3: CDN or Inline Usage

You can also inline the script or serve it from a CDN for better performance.

## Configuration Options

```javascript
window.VisitorTrackingConfig = {
  // API endpoint (required for external hosts)
  apiEndpoint: '/api/web-stats', // or 'https://yourdomain.com/api/web-stats'
  
  // Tracking options
  autoTrack: true,              // Auto-track page views
  trackPageViews: true,         // Track page view events
  trackUserAgent: true,         // Include user agent data
  trackScreenSize: true,        // Include screen/viewport data
  trackReferrer: true,          // Include referrer information
  trackTimezone: true,          // Include timezone data
  trackLanguage: true,          // Include language preferences
  trackPerformance: true,       // Include performance metrics
  
  // Performance options
  debounceTime: 100,            // Debounce time for events (ms)
  maxRetries: 3,                // Max retry attempts
  timeout: 5000                 // Request timeout (ms)
};
```

## Manual Usage

```javascript
// Manual initialization
window.VisitorTracking.init();

// Access tracker instance
const tracker = window.VisitorTracker;

// Track custom events
tracker.track('button_click', { 
  button: 'header_cta', 
  page: 'homepage' 
});

// Track custom data
tracker.trackCustomEvent({ 
  user_type: 'premium',
  experiment: 'version_a' 
});

// Set custom data for all future events
tracker.setCustomData({ 
  user_id: '12345',
  subscription: 'pro' 
});

// Get visitor/session IDs
const visitorId = tracker.getVisitorId();
const sessionId = tracker.getSessionId();
```

## Callback Functions

```javascript
// Success callback
window.onVisitorTrackingSuccess = function(data) {
  console.log('Tracking success:', data);
};

// Error callback
window.onVisitorTrackingError = function(error, data) {
  console.error('Tracking error:', error, data);
};
```

## Data Collected

The script automatically collects:

### Basic Information
- Visitor ID (persistent)
- Session ID (per session)
- Page URL, title, pathname
- Referrer information
- Timestamp data

### Device & Browser
- User agent string
- Screen resolution and color depth
- Viewport size and orientation
- Device type (mobile/tablet/desktop)
- Language preferences
- Timezone information

### Performance Metrics
- Page load time
- DOM ready time
- DNS resolution time
- Connection time
- Render time
- Network information (when available)

### User Behavior
- Time on page
- Page visibility changes
- Custom events and data

## Privacy Considerations

- Respects "Do Not Track" browser settings
- No personally identifiable information collected by default
- Uses localStorage for visitor persistence (can be cleared)
- Configurable data collection levels
- CORS-compliant for cross-origin requests

## Browser Support

- Modern browsers (ES6+)
- Graceful degradation for older browsers
- Mobile browsers supported
- Works with Single Page Applications (SPAs)

## Performance Impact

- Minimal: ~8KB minified
- Asynchronous data collection
- Debounced events prevent spam
- Timeout and retry handling
- Uses sendBeacon for unload events

## Integration Examples

### React/Next.js
```jsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Configure before loading
    window.VisitorTrackingConfig = {
      apiEndpoint: '/api/web-stats',
      trackPerformance: true
    };
    
    // Load script dynamically
    const script = document.createElement('script');
    script.src = '/visitor-tracking.js';
    document.head.appendChild(script);
  }, []);
  
  return <div>Your App</div>;
}
```

### WordPress
```php
// In your theme's functions.php
function add_visitor_tracking() {
    ?>
    <script>
    window.VisitorTrackingConfig = {
        apiEndpoint: '<?php echo home_url('/api/web-stats'); ?>',
        trackPerformance: true
    };
    </script>
    <script src="<?php echo get_template_directory_uri(); ?>/js/visitor-tracking.js"></script>
    <?php
}
add_action('wp_head', 'add_visitor_tracking');
```

### Google Tag Manager
```javascript
// Custom HTML Tag
<script>
window.VisitorTrackingConfig = {
  apiEndpoint: 'https://yourdomain.com/api/web-stats'
};
</script>
<script src="https://yourdomain.com/visitor-tracking.js"></script>
```

## Troubleshooting

### CORS Issues
Ensure your API endpoint includes proper CORS headers:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Performance Issues
- Use CDN for external hosts
- Enable gzip compression
- Set appropriate cache headers
- Consider bundling with your main JS

### Data Not Appearing
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests
4. Ensure CORS headers are set correctly
5. Verify database permissions

## Security Considerations

- Validate and sanitize all input data server-side
- Implement rate limiting on the API endpoint
- Use HTTPS for external host usage
- Consider implementing API key authentication for external hosts
- Monitor for unusual traffic patterns