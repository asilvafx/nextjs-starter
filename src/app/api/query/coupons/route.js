import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';

/**
 * @swagger
 * /api/query/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 */
async function GET() {
  try {
    const coupons = await DBService.readAll('coupons') || [];
    
    // Sort by creation date (newest first)
    const sortedCoupons = coupons.sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    return NextResponse.json({
      success: true,
      data: sortedCoupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CouponInput'
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Conflict - coupon code already exists
 */
async function POST(request) {
  try {
    const couponData = await request.json();

    // Validate required fields
    const requiredFields = ['code', 'name', 'type', 'value'];
    for (const field of requiredFields) {
      if (!couponData[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Normalize and validate coupon code
    const normalizedCode = couponData.code.toUpperCase().trim();
    if (normalizedCode.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Coupon code must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existingCoupons = await DBService.readAll('coupons') || [];
    const codeExists = existingCoupons.some(coupon => 
      coupon.code?.toUpperCase() === normalizedCode
    );

    if (codeExists) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    // Validate discount value
    if (couponData.type === 'percentage' && (couponData.value < 0 || couponData.value > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (couponData.type === 'fixed' && couponData.value < 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed discount cannot be negative' },
        { status: 400 }
      );
    }

    // Validate amounts
    if (couponData.minAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount cannot be negative' },
        { status: 400 }
      );
    }

    if (couponData.maxAmount && couponData.maxAmount < couponData.minAmount) {
      return NextResponse.json(
        { success: false, error: 'Maximum amount cannot be less than minimum amount' },
        { status: 400 }
      );
    }

    // Validate usage limit
    if (couponData.usageType === 'limited' && couponData.usageLimit < 1) {
      return NextResponse.json(
        { success: false, error: 'Usage limit must be at least 1' },
        { status: 400 }
      );
    }

    // Validate target email for specific coupons
    if (couponData.targetType === 'specific' && !couponData.targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Target email is required for specific coupons' },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (couponData.expiresAt && new Date(couponData.expiresAt) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Prepare coupon data
    const newCoupon = {
      id,
      code: normalizedCode,
      name: couponData.name.trim(),
      description: couponData.description?.trim() || '',
      type: couponData.type,
      value: parseFloat(couponData.value),
      minAmount: parseFloat(couponData.minAmount) || 0,
      maxAmount: parseFloat(couponData.maxAmount) || 0,
      usageType: couponData.usageType || 'unlimited',
      usageLimit: couponData.usageType === 'limited' ? parseInt(couponData.usageLimit) : 0,
      usedCount: 0,
      targetType: couponData.targetType || 'public',
      targetEmail: couponData.targetType === 'specific' ? couponData.targetEmail?.trim() : '',
      expiresAt: couponData.expiresAt || null,
      isActive: couponData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    const saved = await DBService.create(newCoupon, 'coupons');
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to create coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: newCoupon },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/coupons:
 *   put:
 *     summary: Update an existing coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CouponInput'
 *               - type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Coupon ID
 *                 required:
 *                   - id
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Coupon not found
 *       409:
 *         description: Conflict - coupon code already exists
 */
async function PUT(request) {
  try {
    const couponData = await request.json();

    if (!couponData.id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Check if coupon exists
    const existingCoupons = await DBService.readAll('coupons') || [];
    const existingCoupon = existingCoupons.find(coupon => coupon.id === couponData.id);

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = ['code', 'name', 'type', 'value'];
    for (const field of requiredFields) {
      if (!couponData[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Normalize and validate coupon code
    const normalizedCode = couponData.code.toUpperCase().trim();
    if (normalizedCode.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Coupon code must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists (excluding current coupon)
    const codeExists = existingCoupons.some(coupon => 
      coupon.code?.toUpperCase() === normalizedCode && coupon.id !== couponData.id
    );

    if (codeExists) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    // Validate discount value
    if (couponData.type === 'percentage' && (couponData.value < 0 || couponData.value > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (couponData.type === 'fixed' && couponData.value < 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed discount cannot be negative' },
        { status: 400 }
      );
    }

    // Validate amounts
    if (couponData.minAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Minimum amount cannot be negative' },
        { status: 400 }
      );
    }

    if (couponData.maxAmount && couponData.maxAmount < couponData.minAmount) {
      return NextResponse.json(
        { success: false, error: 'Maximum amount cannot be less than minimum amount' },
        { status: 400 }
      );
    }

    // Validate usage limit
    if (couponData.usageType === 'limited' && couponData.usageLimit < 1) {
      return NextResponse.json(
        { success: false, error: 'Usage limit must be at least 1' },
        { status: 400 }
      );
    }

    // Validate target email for specific coupons
    if (couponData.targetType === 'specific' && !couponData.targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Target email is required for specific coupons' },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (couponData.expiresAt && new Date(couponData.expiresAt) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // Prepare updated coupon data
    const updatedCoupon = {
      ...existingCoupon,
      code: normalizedCode,
      name: couponData.name.trim(),
      description: couponData.description?.trim() || '',
      type: couponData.type,
      value: parseFloat(couponData.value),
      minAmount: parseFloat(couponData.minAmount) || 0,
      maxAmount: parseFloat(couponData.maxAmount) || 0,
      usageType: couponData.usageType || 'unlimited',
      usageLimit: couponData.usageType === 'limited' ? parseInt(couponData.usageLimit) : 0,
      targetType: couponData.targetType || 'public',
      targetEmail: couponData.targetType === 'specific' ? couponData.targetEmail?.trim() : '',
      expiresAt: couponData.expiresAt || null,
      isActive: couponData.isActive !== false,
      updatedAt: new Date().toISOString(),
    };

    // Update in database
    const updated = await DBService.update(couponData.id, updatedCoupon, 'coupons');
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCoupon
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/coupons:
 *   delete:
 *     summary: Delete a coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID to delete
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       400:
 *         description: Bad request - ID is required
 *       404:
 *         description: Coupon not found
 */
async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Check if coupon exists
    const existingCoupons = await DBService.readAll('coupons') || [];
    const couponExists = existingCoupons.some(coupon => coupon.id === id);

    if (!couponExists) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Delete from database
    const deleted = await DBService.delete(id, 'coupons');
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}

// Apply authentication middleware and export
const AuthenticatedGET = withAuth(GET);
const AuthenticatedPOST = withAuth(POST);
const AuthenticatedPUT = withAuth(PUT);
const AuthenticatedDELETE = withAuth(DELETE);

export { AuthenticatedGET as GET, AuthenticatedPOST as POST, AuthenticatedPUT as PUT, AuthenticatedDELETE as DELETE };