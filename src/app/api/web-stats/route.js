// app/api/web-stats/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

// Helper function to get client IP address
function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr =
        request.headers.get('x-vercel-forwarded-for') ||
        request.headers.get('cf-connecting-ip') ||
        forwarded?.split(',')[0] ||
        realIP ||
        '127.0.0.1';

    return remoteAddr.trim();
}

// Helper function to get country from IP (simplified)
async function getCountryFromIP(ip) {
    if (ip === '127.0.0.1' || ip === 'localhost') {
        return 'Local';
    }

    try {
        // Using a free IP geolocation service
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`);
        const data = await response.json();
        return data.country || 'Unknown';
    } catch (error) {
        console.error('Error getting country from IP:', error);
        return 'Unknown';
    }
}

// Helper function to parse user agent
function parseUserAgent(userAgent) {
    const browser = userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
          ? 'Firefox'
          : userAgent.includes('Safari')
            ? 'Safari'
            : userAgent.includes('Edge')
              ? 'Edge'
              : 'Other';

    const os = userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac OS X')
          ? 'macOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : userAgent.includes('Android')
              ? 'Android'
              : userAgent.includes('iOS')
                ? 'iOS'
                : 'Other';

    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

    return { browser, os, isMobile };
}

// Helper function to check for duplicate entries
async function isDuplicateEntry(sessionId, pathname, timeWindow = 30000) {
    try {
        const recentStats = await DBService.readAll('web_stats');
        if (!recentStats) return false;

        const statsArray = Array.isArray(recentStats) ? recentStats : Object.values(recentStats);
        const now = Date.now();

        // Check for recent entries from the same session and page
        const duplicates = statsArray.filter((stat) => {
            const statTime = new Date(stat.timestamp).getTime();
            return (
                stat.sessionId === sessionId &&
                stat.pathname === pathname &&
                now - statTime < timeWindow &&
                stat.eventType === 'pageview'
            );
        });

        return duplicates.length > 0;
    } catch (error) {
        console.error('Error checking for duplicates:', error);
        return false; // If we can't check, allow the entry
    }
}

// POST - Record visitor statistics
async function handlePost(request) {
    try {
        const body = await request.text();
        if (!body.trim()) {
            console.log('Empty request body, skipping...');
            return NextResponse.json({ success: true, message: 'Empty request body' });
        }

        const data = JSON.parse(body);

        // Skip unload events for now as they're not needed for analytics
        if (data.type === 'unload') {
            return NextResponse.json({ success: true, message: 'Unload event acknowledged' });
        }

        // Check for duplicate page views
        if (data.type === 'pageview' && data.sessionId && data.pathname) {
            const isDuplicate = await isDuplicateEntry(data.sessionId, data.pathname);
            if (isDuplicate) {
                console.log('Duplicate page view detected, skipping...');
                return NextResponse.json({
                    success: true,
                    message: 'Duplicate page view detected, entry skipped',
                    duplicate: true
                });
            }
        }

        // Get client information
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || '';
        const referer = request.headers.get('referer') || data.referer || '';

        // Parse user agent
        const { browser, os, isMobile } = parseUserAgent(userAgent);

        // Get country from IP
        const country = await getCountryFromIP(ip);

        // Create visitor record
        const visitorData = {
            // Basic identifiers
            visitorId: data.visitorId || null,
            sessionId: data.sessionId || null,
            ip: ip,
            userAgent: userAgent,

            // Page info
            url: data.url || '',
            pathname: data.pathname || '',
            title: data.title || '',
            referrer: data.referrer || referer,

            // Device info from parsed user agent
            browser: browser,
            os: os,
            isMobile: isMobile,

            // Device info from tracking script
            screenWidth: data.device?.screen?.width || null,
            screenHeight: data.device?.screen?.height || null,
            viewportWidth: data.device?.viewport?.width || null,
            viewportHeight: data.device?.viewport?.height || null,
            pixelRatio: data.device?.pixelRatio || null,
            orientation: data.device?.orientation || null,

            // Location
            country: country,

            // Language and timezone
            language: data.language || null,
            timezone: data.timezone || null,
            timezoneOffset: data.timezoneOffset || null,

            // Performance metrics
            loadTime: data.performance?.loadTime || null,
            domReadyTime: data.performance?.domReadyTime || null,
            renderTime: data.performance?.renderTime || null,

            // Timing
            timeOnPage: data.timeOnPage || null,
            pageLoadTime: data.pageLoadTime || null,

            // Event info
            eventType: data.type || 'pageview',
            eventName: data.eventName || null,
            eventData: data.eventData ? JSON.stringify(data.eventData) : null,

            // Custom data
            customData: data.customData ? JSON.stringify(data.customData) : null,

            // Metadata
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            hour: new Date().getHours(),

            // UTM parameters from URL params
            utmSource: data.params?.utm_source || null,
            utmMedium: data.params?.utm_medium || null,
            utmCampaign: data.params?.utm_campaign || null,
            utmTerm: data.params?.utm_term || null,
            utmContent: data.params?.utm_content || null,

            // Additional metadata
            cookieEnabled: data.cookieEnabled || null,
            doNotTrack: data.doNotTrack || false
        };

        // Save to database
        const result = await DBService.create(visitorData, 'web_stats');

        if (!result) {
            return NextResponse.json({ error: 'Failed to save visitor data' });
        }

        return NextResponse.json({
            success: true,
            message: 'Visitor data recorded successfully',
            data: {
                id: result.id || result.key || Date.now().toString(),
                country: country,
                browser: browser,
                os: os,
                isMobile: isMobile
            }
        });
    } catch (error) {
        console.error('Web stats error:', error);
        return NextResponse.json({
            error: 'Failed to record visitor data',
            message: error.message
        });
    }
}

// GET - Retrieve analytics data (authenticated)
// Wrapper for server function - kept for backward compatibility
async function handleGet(request) {
    try {
        const { getWebStats } = await import('@/lib/server/analytics.js');

        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const type = url.searchParams.get('type') || 'overview';

        const result = await getWebStats({ startDate, endDate, type });

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error('Analytics retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve analytics data',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// Export handlers with CORS for cross-origin requests
export async function POST(request) {
    const response = await handlePost(request);

    // Add CORS headers for cross-origin requests
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
}

export async function GET(request) {
    return await handleGet(request);
}

export async function OPTIONS(_request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
