// /api/store/settings/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET(request) {
  try {
    // Get store settings
    const storeSettingsResponse = await DBService.readAll('store_settings');
    let storeSettings = null;
    
    if (storeSettingsResponse && storeSettingsResponse.length > 0) {
      storeSettings = storeSettingsResponse[0];
    }

    if (!storeSettings) {
      // Return default settings if none exist
      storeSettings = {
        businessName: "Your Store",
        currency: "EUR",
        vatPercentage: 20,
        vatIncludedInPrice: true,
        applyVatAtCheckout: true,
        freeShippingEnabled: false,
        freeShippingThreshold: 50,
        freeShippingCountries: [],
        paymentMethods: {
          cardPayments: false,
          bankTransfer: false,
          payOnDelivery: false
        },
        carriers: []
      };
    }

    return NextResponse.json({
      success: true,
      data: storeSettings
    });

  } catch (error) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch store settings'
    }, { status: 500 });
  }
}