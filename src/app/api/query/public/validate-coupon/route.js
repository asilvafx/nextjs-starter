import { NextRequest, NextResponse } from 'next/server';
import { withPublicAccess } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';

/**
 * @swagger
 * /api/query/public/validate-coupon:
 *   post:
 *     summary: Validate a coupon code for checkout
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code to validate
 *               orderAmount:
 *                 type: number
 *                 description: Total order amount before discount
 *               customerEmail:
 *                 type: string
 *                 description: Customer email for specific coupon validation
 *             required:
 *               - code
 *               - orderAmount
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *                 discount:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       description: Discount amount in euros
 *                     type:
 *                       type: string
 *                       enum: [percentage, fixed]
 *                     value:
 *                       type: number
 *                       description: Original coupon value
 *                 message:
 *                   type: string
 *                   description: Validation message
 *       400:
 *         description: Bad request - invalid input
 */
async function POST(request) {
  try {
    const { code, orderAmount, customerEmail } = await request.json();

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Coupon code is required'
      }, { status: 400 });
    }

    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount < 0) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Valid order amount is required'
      }, { status: 400 });
    }

    // Find coupon
    const coupons = await DBService.readAll('coupons') || [];
    const normalizedCode = code.toUpperCase().trim();
    const coupon = coupons.find(c => c.code?.toUpperCase() === normalizedCode);

    if (!coupon) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'This coupon is no longer active'
      });
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'This coupon has expired'
      });
    }

    // Check usage limits
    if (coupon.usageType === 'limited' && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'This coupon has reached its usage limit'
      });
    }

    if (coupon.usageType === 'single' && coupon.usedCount >= 1) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'This coupon has already been used'
      });
    }

    // Check target restrictions
    if (coupon.targetType === 'specific') {
      if (!customerEmail) {
        return NextResponse.json({
          success: true,
          valid: false,
          message: 'Customer email is required for this coupon'
        });
      }

      if (coupon.targetEmail?.toLowerCase() !== customerEmail.toLowerCase()) {
        return NextResponse.json({
          success: true,
          valid: false,
          message: 'This coupon is not valid for your account'
        });
      }
    }

    // Check minimum order amount
    if (coupon.minAmount > 0 && orderAmount < coupon.minAmount) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: `Minimum order amount of €${coupon.minAmount} required for this coupon`
      });
    }

    // Check maximum order amount
    if (coupon.maxAmount > 0 && orderAmount > coupon.maxAmount) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: `This coupon is only valid for orders up to €${coupon.maxAmount}`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, orderAmount); // Don't exceed order amount
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value
      },
      discount: {
        amount: discountAmount,
        type: coupon.type,
        value: coupon.value
      },
      message: `Coupon applied! You saved €${discountAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({
      success: false,
      valid: false,
      message: 'Failed to validate coupon'
    }, { status: 500 });
  }
}

export { POST };

// Apply public access middleware
export const withPublicPOST = withPublicAccess(POST);