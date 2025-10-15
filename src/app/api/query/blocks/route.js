import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth.js';

// GET /api/query/blocks - Get all blocks
export const GET = withAuth(async (request) => {
  try {
    const blocks = await DBService.readAll('blocks');
    
    return NextResponse.json({
      success: true,
      data: blocks || []
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
});

// POST /api/query/blocks - Create new block
export const POST = withAuth(async (request) => {
  try {
    const blockData = await request.json();
    
    // Validate required fields
    if (!blockData.name || !blockData.slug || !blockData.type) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and type are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingBlocks = await DBService.readAll('blocks');
    const slugExists = existingBlocks.some(block => block.slug === blockData.slug);
    
    if (slugExists) {
      return NextResponse.json(
        { success: false, error: 'A block with this slug already exists' },
        { status: 400 }
      );
    }

    // Create new block with ID and timestamps
    const newBlock = {
      id: Date.now().toString(),
      ...blockData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: blockData.tags || [],
      customCSS: blockData.customCSS || '',
      customJS: blockData.customJS || '',
      isActive: blockData.hasOwnProperty('isActive') ? blockData.isActive : true,
    };

    const result = await DBService.create(newBlock, 'blocks');
    
    return NextResponse.json({
      success: true,
      data: newBlock
    });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create block' },
      { status: 500 }
    );
  }
});

// PUT /api/query/blocks - Update block
export const PUT = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('id');
    const updateData = await request.json();
    
    if (!blockId) {
      return NextResponse.json(
        { success: false, error: 'Block ID is required' },
        { status: 400 }
      );
    }

    // Check if block exists
    const existingBlock = await DBService.read(blockId, 'blocks');
    if (!existingBlock) {
      return NextResponse.json(
        { success: false, error: 'Block not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for duplicates
    if (updateData.slug && updateData.slug !== existingBlock.slug) {
      const allBlocks = await DBService.readAll('blocks');
      const slugExists = allBlocks.some(block => 
        block.slug === updateData.slug && block.id !== blockId
      );
      
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'A block with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update block
    const updatedBlock = {
      ...existingBlock,
      ...updateData,
      id: blockId, // Ensure ID doesn't get overwritten
      updatedAt: new Date().toISOString(),
      createdAt: existingBlock.createdAt, // Preserve original creation date
    };

    await DBService.update(blockId, updatedBlock, 'blocks');
    
    return NextResponse.json({
      success: true,
      data: updatedBlock
    });
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update block' },
      { status: 500 }
    );
  }
});

// DELETE /api/query/blocks - Delete block
export const DELETE = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('id');
    
    if (!blockId) {
      return NextResponse.json(
        { success: false, error: 'Block ID is required' },
        { status: 400 }
      );
    }

    // Check if block exists
    const existingBlock = await DBService.read(blockId, 'blocks');
    if (!existingBlock) {
      return NextResponse.json(
        { success: false, error: 'Block not found' },
        { status: 404 }
      );
    }

    await DBService.delete(blockId, 'blocks');
    
    return NextResponse.json({
      success: true,
      message: 'Block deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete block' },
      { status: 500 }
    );
  }
});