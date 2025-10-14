// @/lib/client/integrations.js
"use client";

let integrationsCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch enabled integrations from the database
 * @returns {Promise<Object>} Object with integration data keyed by integration ID
 */
export async function fetchIntegrations() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (integrationsCache && now < cacheExpiry) {
    return integrationsCache;
  }
  
  try {
    let browserFingerprint = 'anonymous';
    
    // Try to get fingerprint, but don't fail if it's not available
    try {
      const { default: Fingerprint } = await import('@/utils/fingerprint.js');
      browserFingerprint = await Fingerprint();
    } catch (fingerprintError) {
      console.warn('Fingerprint not available:', fingerprintError);
    }
    
    const response = await fetch('/api/query/public/integrations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Fingerprint': browserFingerprint,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    });
    const result = await response.json();
    
    if (result.success) {
      // Convert array to object keyed by integration ID for easier access
      const integrationsMap = {};
      result.data.forEach(integration => {
        integrationsMap[integration.id] = integration;
      });
      
      // Cache the result
      integrationsCache = integrationsMap;
      cacheExpiry = now + CACHE_DURATION;
      
      return integrationsMap;
    } else {
      console.error('Failed to fetch integrations:', result.error);
      return {};
    }
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return {};
  }
}

/**
 * Get a specific integration by ID
 * @param {string} integrationId - The integration ID to fetch
 * @returns {Promise<Object|null>} Integration data or null if not found/enabled
 */
export async function getIntegration(integrationId) {
  const integrations = await fetchIntegrations();
  return integrations[integrationId] || null;
}

/**
 * Check if an integration is enabled and configured
 * @param {string} integrationId - The integration ID to check
 * @returns {Promise<boolean>} True if integration is enabled and configured
 */
export async function isIntegrationEnabled(integrationId) {
  const integration = await getIntegration(integrationId);
  return integration && integration.enabled && integration.configured;
}

/**
 * Get Cloudflare Turnstile site key if enabled
 * @returns {Promise<string|null>} Site key or null if not enabled
 */
export async function getTurnstileSiteKey() {
  const integration = await getIntegration('cloudflare-turnstile');
  return integration?.publicSettings?.siteKey || null;
}

/**
 * Get Google Maps API key if enabled
 * @returns {Promise<string|null>} API key or null if not enabled
 */
export async function getGoogleMapsApiKey() {
  const integration = await getIntegration('google-maps');
  return integration?.publicSettings?.apiKey || null;
}

/**
 * Get Google Analytics measurement ID if enabled
 * @returns {Promise<string|null>} Measurement ID or null if not enabled
 */
export async function getGoogleAnalyticsMeasurementId() {
  const integration = await getIntegration('google-analytics');
  return integration?.publicSettings?.measurementId || null;
}

/**
 * Clear the integrations cache (useful for forced refresh)
 */
export function clearIntegrationsCache() {
  integrationsCache = null;
  cacheExpiry = 0;
}