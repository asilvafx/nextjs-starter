// app/api/store/settings/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET(request) {
    try {
        const response = await DBService.readAll('store_settings');
        
        let storeSettings = null;
        if (response && Object.keys(response).length > 0) {
            // Get the first settings record
            storeSettings = Object.values(response)[0];
        }
        
        // Return default settings if none found
        if (!storeSettings) {
            storeSettings = {
                businessName: "Store",
                tvaNumber: "",
                address: "",
                vatPercentage: 20,
                vatIncludedInPrice: true,
                applyVatAtCheckout: true,
                paymentMethods: {
                    cardPayments: true,
                    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PK || "",
                    stripeSecretKey: "",
                    bankTransfer: false,
                    payOnDelivery: false,
                },
                freeShippingEnabled: true,
                freeShippingThreshold: 50,
                internationalShipping: true,
                allowedCountries: ["FRA", "DEU", "ITA", "ESP", "BEL", "NLD", "LUX"],
                bannedCountries: [],
                currency: "EUR",
            };
        }
        
        // Don't expose sensitive keys in public API
        const publicSettings = {
            ...storeSettings,
            paymentMethods: {
                ...storeSettings.paymentMethods,
                stripeSecretKey: undefined, // Remove secret key from public response
            }
        };
        
        return NextResponse.json({
            success: true,
            data: publicSettings
        });
        
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch store settings'
            },
            { status: 500 }
        );
    }
}