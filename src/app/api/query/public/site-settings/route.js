import { NextRequest, NextResponse } from 'next/server';
import { getPublicSiteSettings, validateApiKey } from '@/lib/server/admin.js';
import { withPublicAccess } from '@/lib/server/auth.js';

/**
 * Public API endpoint for site settings
 * Returns filtered site settings that don't include sensitive data
 * 
 * Authentication:
 * - Optional: X-API-Key header for enhanced access
 * - Without API key: Returns basic public settings only
 * - With valid API key: Returns settings based on key permissions
 */
async function handleGetPublicSiteSettings(req) {
    try {
        // Get API key from headers
        const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
        
        let apiKeyData = null;
        
        // Validate API key if provided
        if (apiKey) {
            try {
                const keyValidation = await validateApiKey(apiKey);
                if (keyValidation.success) {
                    apiKeyData = keyValidation.data;
                } else {
                    // Invalid API key - return error
                    return NextResponse.json({
                        success: false,
                        error: 'Invalid API key'
                    }, { status: 401 });
                }
            } catch (error) {
                console.error('API key validation error:', error);
                return NextResponse.json({
                    success: false,
                    error: 'API key validation failed'
                }, { status: 401 });
            }
        }

        // Get filtered site settings
        const settings = await getPublicSiteSettings(apiKeyData);
        
        return NextResponse.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('Error fetching public site settings:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch site settings'
        }, { status: 500 });
    }
}

// Export GET handler with public access protection
export const GET = withPublicAccess(handleGetPublicSiteSettings, {
    enableCsrfProtection: true,
    enableRateLimit: true
});