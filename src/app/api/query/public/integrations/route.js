// @/app/api/query/public/integrations/route.js
import { NextResponse } from 'next/server';
import { withPublicAccess } from '@/lib/server/auth';
import DBService from '@/data/rest.db.js';

// GET - Public endpoint to retrieve enabled integrations (without sensitive data)
async function handleGet(request) {
  try {
    // Allow same-host access without strict auth
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const referer = request.headers.get('referer');
    
    // Check if request is from same host
    const isSameHost = !origin || 
      origin === `http://${host}` || 
      origin === `https://${host}` ||
      (referer && (referer.startsWith(`http://${host}`) || referer.startsWith(`https://${host}`)));
    
    if (!isSameHost) {
      return Response.json({
        success: false,
        error: 'Cross-origin access not allowed for integrations endpoint'
      }, { status: 403 });
    }
    
    let integrations = await DBService.readAll('integrations');
    
    // If no integrations exist, return empty array (they'll be created when accessing admin)
    if (!integrations || (Array.isArray(integrations) && integrations.length === 0) || Object.keys(integrations).length === 0) {
      return Response.json({
        success: true,
        data: []
      });
    }
    
    // Convert to array if it's an object
    if (!Array.isArray(integrations)) {
      integrations = Object.values(integrations);
    }
    
    // Filter and sanitize data for public consumption
    const publicIntegrations = integrations
      .filter(integration => integration && integration.enabled && integration.configured)
      .map(integration => ({
        id: integration.id,
        name: integration.name,
        category: integration.category,
        enabled: integration.enabled,
        configured: integration.configured,
        // Only include non-sensitive settings for public use
        publicSettings: getPublicSettings(integration)
      }));

    return Response.json({
      success: true,
      data: publicIntegrations
    });
  } catch (error) {
    console.error('Error fetching public integrations:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch integrations'
    }, { status: 500 });
  }
}

// Helper function to extract only public-safe settings
function getPublicSettings(integration) {
  const publicSettings = {};
  
  switch (integration.id) {
    case 'google-analytics':
      if (integration.settings.measurementId) {
        publicSettings.measurementId = integration.settings.measurementId;
      }
      break;
    case 'cloudflare-turnstile':
      if (integration.settings.siteKey) {
        publicSettings.siteKey = integration.settings.siteKey;
      }
      break;
    case 'google-maps':
      if (integration.settings.apiKey) {
        publicSettings.apiKey = integration.settings.apiKey;
      }
      break;
    default:
      // For custom integrations, don't expose any settings by default
      break;
  }
  
  return publicSettings;
}

// Export directly without middleware to allow same-host access
export const GET = { handleGet };
