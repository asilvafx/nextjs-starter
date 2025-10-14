// app/api/query/api_settings/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth.js';

// GET API settings
async function handleGetApiSettings(request) {
  try {
    const result = await DBService.readAll('api_settings');
    
    return NextResponse.json({
      success: true,
      data: Object.values(result || {})
    });
  } catch (error) {
    console.error('Error fetching API settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API settings' },
      { status: 500 }
    );
  }
}

// POST - Create new API settings
async function handleCreateApiSettings(request) {
  try {
    const data = await request.json();
    
    // Check if settings already exist
    const existing = await DBService.readAll('api_settings');
    if (existing && Object.keys(existing).length > 0) {
      return NextResponse.json(
        { success: false, error: 'API settings already exist. Use PUT to update.' },
        { status: 400 }
      );
    }
    
    const settingsData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newSettings = await DBService.create(settingsData, 'api_settings');
    
    return NextResponse.json({
      success: true,
      data: {
        id: newSettings.id || newSettings.key || Date.now().toString(),
        ...settingsData
      },
      message: 'API settings created successfully!'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating API settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create API settings' },
      { status: 500 }
    );
  }
}

// PUT - Update API settings
async function handleUpdateApiSettings(request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'Settings ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Check if settings exist
    const existing = await DBService.read(data.id, 'api_settings');
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'API settings not found' },
        { status: 404 }
      );
    }
    
    const { id, ...updateFields } = data;
    const updateData = {
      ...existing,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    
    const updated = await DBService.update(id, updateData, 'api_settings');
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update API settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { id, ...updateData },
      message: 'API settings updated successfully!'
    });
    
  } catch (error) {
    console.error('Error updating API settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update API settings' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(handleGetApiSettings);
export const POST = withAuth(handleCreateApiSettings);
export const PUT = withAuth(handleUpdateApiSettings);