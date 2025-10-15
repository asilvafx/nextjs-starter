import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withPublicAccess } from '@/lib/server/auth.js';

// GET /api/query/public/blocks - Get all active blocks or specific block by slug
export const GET = withPublicAccess(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type');
    const active = searchParams.get('active') !== 'false'; // Default to true
    
    if (slug) {
      // Get specific block by slug
      const blocks = await DBService.readAll('blocks');
      const block = blocks.find(b => b.slug === slug && (!active || b.isActive));
      
      if (!block) {
        return NextResponse.json(
          { success: false, error: 'Block not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: block
      });
    } else {
      // Get all blocks (filtered)
      let blocks = await DBService.readAll('blocks');
      
      // Filter by active status
      if (active) {
        blocks = blocks.filter(block => block.isActive);
      }
      
      // Filter by type if specified
      if (type) {
        blocks = blocks.filter(block => block.type === type);
      }
      
      // Sort by updatedAt descending
      blocks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      return NextResponse.json({
        success: true,
        data: blocks || []
      });
    }
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
});