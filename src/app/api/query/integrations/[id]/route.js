// @/app/api/query/integrations/[id]/route.js
import { withAuth } from '@/lib/server/auth';
import DBService from '@/data/rest.db.js';

// GET - Retrieve specific integration
async function handleGet(request, { params }) {
  try {
    const { id } = params;
    
    const integration = await DBService.read(id, 'integrations');
    
    if (!integration) {
      return Response.json({
        success: false,
        error: 'Integration not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch integration'
    }, { status: 500 });
  }
}

// PUT - Update integration
async function handlePut(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Get existing integration
    const existing = await DBService.read(id, 'integrations');
    if (!existing) {
      return Response.json({
        success: false,
        error: 'Integration not found'
      }, { status: 404 });
    }

    // Check if integration is configured (all required fields have values)
    const isConfigured = existing.requiredFields.every(field => {
      const value = body.settings?.[field] || existing.settings?.[field];
      return value && value.trim() !== '';
    });

    // Update integration
    const updatedIntegration = {
      ...existing,
      ...body,
      configured: isConfigured,
      settings: {
        ...existing.settings,
        ...(body.settings || {})
      },
      updatedAt: new Date().toISOString()
    };

    await DBService.update(id, updatedIntegration, 'integrations');

    return Response.json({
      success: true,
      data: updatedIntegration
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return Response.json({
      success: false,
      error: 'Failed to update integration'
    }, { status: 500 });
  }
}

// DELETE - Delete integration
async function handleDelete(request, { params }) {
  try {
    const { id } = params;
    
    const existing = await DBService.read(id, 'integrations');
    if (!existing) {
      return Response.json({
        success: false,
        error: 'Integration not found'
      }, { status: 404 });
    }

    await DBService.delete(id, 'integrations');

    return Response.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return Response.json({
      success: false,
      error: 'Failed to delete integration'
    }, { status: 500 });
  }
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete); 
