import { NextRequest, NextResponse } from 'next/server';
import { withPublicAccess } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';

/**
 * @swagger
 * /api/query/public/apply-coupon:
 *   post:
 *     summary: Apply a coupon code (increment usage count)
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponId:
 *                 type: string
 *                 description: Coupon ID to apply
 *               orderId:
 *                 type: string
 *                 description: Order ID for tracking
 *               customerEmail:
 *                 type: string
 *                 description: Customer email
 *               orderAmount:
 *                 type: number
 *                 description: Total order amount
 *               discountAmount:
 *                 type: number
 *                 description: Applied discount amount
 *             required:
 *               - couponId
 *               - orderId
 *               - orderAmount
 *               - discountAmount
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Bad request - invalid input
 *       404:
 *         description: Coupon not found
 *       409:
 *         description: Coupon cannot be applied
 */
async function POST(request) {
  try {
    const { couponId, orderId, customerEmail, orderAmount, discountAmount } = await request.json();

    // Validate input
    if (!couponId || !orderId || !orderAmount || discountAmount === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Find coupon
    const coupons = await DBService.readAll('coupons') || [];
    const coupon = coupons.find(c => c.id === couponId);

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }

    // Double-check coupon is still valid (security measure)
    if (!coupon.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Coupon is no longer active'
      }, { status: 409 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Coupon has expired'
      }, { status: 409 });
    }

    if (coupon.usageType === 'limited' && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: false,
        error: 'Coupon usage limit reached'
      }, { status: 409 });
    }

    if (coupon.usageType === 'single' && coupon.usedCount >= 1) {
      return NextResponse.json({
        success: false,
        error: 'Coupon already used'
      }, { status: 409 });
    }

    // Increment usage count
    const updatedCoupon = {
      ...coupon,
      usedCount: (coupon.usedCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
      lastUsedBy: customerEmail || 'anonymous',
      updatedAt: new Date().toISOString()
    };

    // Update coupon in database
    const updated = await DBService.update(couponId, updatedCoupon, 'coupons');
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update coupon usage'
      }, { status: 500 });
    }

    // Log coupon usage for analytics (optional)
    try {
      const usageLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        couponId: couponId,
        couponCode: coupon.code,
        orderId: orderId,
        customerEmail: customerEmail || 'anonymous',
        orderAmount: orderAmount,
        discountAmount: discountAmount,
        appliedAt: new Date().toISOString()
      };

      // Store usage log (create collection if it doesn't exist)
      await DBService.create(usageLog, 'coupon_usage_logs');
    } catch (logError) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log coupon usage:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        couponId: coupon.id,
        code: coupon.code,
        usedCount: updatedCoupon.usedCount,
        discountAmount: discountAmount
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to apply coupon'
    }, { status: 500 });
  }
}

export { POST };

// Apply public access middleware
export const withPublicPOST = withPublicAccess(POST);