// app/api/shop/shipping/route.js
import { NextRequest, NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const country = searchParams.get('country');

        if (!country) {
            return NextResponse.json(
                { error: 'Country parameter is required' },
                { status: 400 }
            );
        }

        // Get store settings to fetch carriers
        const storeSettingsResponse = await DBService.readAll('store_settings');
        let storeSettings = null;
        
        if (storeSettingsResponse && storeSettingsResponse.length > 0) {
            storeSettings = storeSettingsResponse[0];
        }

        if (!storeSettings || !storeSettings.carriers || storeSettings.carriers.length === 0) {
            // Return default shipping methods if no carriers configured
            const defaultMethods = [
                {
                    id: 'standard',
                    name: 'Standard Shipping',
                    description: 'Delivery within 5-7 business days',
                    fixed_rate: 5.99,
                    logo: null,
                    carrier_name: 'Standard',
                    delivery_time: '5-7 business days'
                }
            ];

            return NextResponse.json({
                success: true,
                shippingMethods: defaultMethods,
                country: country
            });
        }

        // Filter carriers based on country and enabled status
        const availableCarriers = storeSettings.carriers
            .filter(carrier => {
                if (!carrier.enabled) return false;
                if (!carrier.supportedCountries || carrier.supportedCountries.length === 0) return true;
                
                // Check if country matches (case-insensitive, handle both codes and names)
                return carrier.supportedCountries.some(supportedCountry => 
                    supportedCountry.toLowerCase() === country.toLowerCase() ||
                    supportedCountry.toLowerCase().includes(country.toLowerCase()) ||
                    country.toLowerCase().includes(supportedCountry.toLowerCase())
                );
            })
            .map(carrier => ({
                id: carrier.id,
                name: carrier.name,
                carrier_name: carrier.carrierName,
                description: carrier.description,
                delivery_time: carrier.deliveryTime,
                fixed_rate: carrier.basePrice,
                logo: carrier.logo
            }));

        // Add free shipping option if eligible
        if (storeSettings.freeShippingEnabled && 
            storeSettings.freeShippingCountries && 
            storeSettings.freeShippingCountries.includes(country)) {
            
            availableCarriers.push({
                id: 'free_shipping',
                name: 'Free Shipping',
                carrier_name: 'Standard',
                description: `Free shipping for orders over €${storeSettings.freeShippingThreshold || 0}`,
                delivery_time: '5-7 business days',
                fixed_rate: 0,
                logo: null
            });
        }

        return NextResponse.json({
            success: true,
            shippingMethods: availableCarriers,
            country: country
        });

    } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch shipping methods',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Optional: POST method to create new shipping methods
export async function POST(request) {
    try {
        const data = await request.json();

        // Validate required fields
        const requiredFields = ['name', 'description', 'fixed_rate', 'carrier_name', 'delivery_time', 'countries_allowed'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing required fields',
                    missingFields
                },
                { status: 400 }
            );
        }

        // Create shipping method in database
        // const newShippingMethod = await DBService.create(data, 'shipping_methods');

        // Mock response
        const newShippingMethod = {
            id: Date.now(),
            ...data,
            created_at: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            shippingMethod: newShippingMethod
        });

    } catch (error) {
        console.error('Error creating shipping method:', error);
        return NextResponse.json(
            {
                error: 'Failed to create shipping method',
                details: error.message
            },
            { status: 500 }
        );
    }
}
