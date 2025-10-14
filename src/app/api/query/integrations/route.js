// @/app/api/query/integrations/route.js
import { withAuth } from '@/lib/server/auth';
import DBService from '@/data/rest.db.js';

// Default integrations structure
const defaultIntegrations = [
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website analytics and user behavior',
    category: 'Analytics',
    enabled: false,
    configured: false,
    settings: {
      measurementId: '',
      trackingId: ''
    },
    requiredFields: ['measurementId'],
    icon: 'BarChart3'
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Places autocomplete and location services',
    category: 'Location',
    enabled: false,
    configured: false,
    settings: {
      apiKey: ''
    },
    requiredFields: ['apiKey'],
    icon: 'MapPin'
  },
  {
    id: 'cloudflare-turnstile',
    name: 'Cloudflare Turnstile',
    description: 'Bot protection for forms and authentication',
    category: 'Security',
    enabled: false,
    configured: false,
    settings: {
      siteKey: '',
      secretKey: ''
    },
    requiredFields: ['siteKey', 'secretKey'],
    icon: 'Shield'
  }
];

// GET - Retrieve all integrations
async function GET() {
  try {
    // Try to get existing integrations from database
    let integrations = await DBService.readAll('integrations');
    
    // Handle different response formats from different database providers
    let integrationsArray = [];
    
    if (integrations) {
      if (Array.isArray(integrations)) {
        integrationsArray = integrations;
      } else if (typeof integrations === 'object') {
        integrationsArray = Object.values(integrations);
      }
    }
    
    // If no integrations exist or empty array, create default ones
    if (integrationsArray.length === 0) {
      console.log('No integrations found, creating default integrations...');
      integrationsArray = [];
      
      // Save default integrations to database
      for (const integration of defaultIntegrations) {
        try {
          const createdIntegration = {
            ...integration,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await DBService.create(createdIntegration, 'integrations');
          integrationsArray.push(createdIntegration);
          console.log(`Created integration: ${integration.name}`);
        } catch (createError) {
          console.error(`Failed to create integration ${integration.id}:`, createError);
          // Continue with next integration even if one fails
        }
      }
    } else {
      // Ensure all default integrations exist (in case new ones are added)
      const existingIds = integrationsArray.map(i => i?.id).filter(Boolean);
      const missingIntegrations = defaultIntegrations.filter(i => !existingIds.includes(i.id));
      
      if (missingIntegrations.length > 0) {
        console.log(`Adding ${missingIntegrations.length} missing integrations...`);
        for (const integration of missingIntegrations) {
          try {
            const createdIntegration = {
              ...integration,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            await DBService.create(createdIntegration, 'integrations');
            integrationsArray.push(createdIntegration);
            console.log(`Added missing integration: ${integration.name}`);
          } catch (createError) {
            console.error(`Failed to create missing integration ${integration.id}:`, createError);
          }
        }
      }
    }

    return Response.json({
      success: true,
      data: integrationsArray
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch integrations',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create a new integration
async function POST(request) {
  try {
    const body = await request.json();
    const { id, ...integrationData } = body;

    if (!id) {
      return Response.json({
        success: false,
        error: 'Integration id is required'
      }, { status: 400 });
    }

    // Check if integration already exists
    const existing = await DBService.read('integrations', id);
    if (existing) {
      return Response.json({
        success: false,
        error: 'Integration already exists'
      }, { status: 409 });
    }

    // Create integration with proper structure
    const integration = {
      id,
      name: integrationData.name || '',
      description: integrationData.description || '',
      category: integrationData.category || '',
      enabled: false,
      configured: false,
      settings: integrationData.settings || {},
      requiredFields: integrationData.requiredFields || [],
      icon: integrationData.icon || 'Settings',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await DBService.create(integration, 'integrations');

    return Response.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    return Response.json({
      success: false,
      error: 'Failed to create integration'
    }, { status: 500 });
  }
}

export const wrappedGET = withAuth(GET);
export const wrappedPOST = withAuth(POST); 