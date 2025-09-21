// app/api/web-stats/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

// Helper function to get client IP address
function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('x-vercel-forwarded-for') || 
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
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Other';
    
    const os = userAgent.includes('Windows') ? 'Windows' :
               userAgent.includes('Mac OS X') ? 'macOS' :
               userAgent.includes('Linux') ? 'Linux' :
               userAgent.includes('Android') ? 'Android' :
               userAgent.includes('iOS') ? 'iOS' : 'Other';
    
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    return { browser, os, isMobile };
}

// POST - Record visitor statistics
async function handlePost(request) {
    try {
        const data = await request.json();
        
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
            doNotTrack: data.doNotTrack || false,
        };

        // Save to database
        const result = await DBService.create(visitorData, 'web_stats');

        if (!result) {
            return NextResponse.json(
                { error: 'Failed to save visitor data' },
                { status: 500 }
            );
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
        return NextResponse.json(
            {
                error: 'Failed to record visitor data',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// GET - Retrieve analytics data (authenticated)
async function handleGet(request) {
    try {
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const type = url.searchParams.get('type') || 'overview';

        // Get all web stats
        const stats = await DBService.readAll('web_stats');
        
        if (!stats) {
            return NextResponse.json({
                success: true,
                data: {
                    totalVisitors: 0,
                    uniqueVisitors: 0,
                    pageViews: 0,
                    countries: [],
                    browsers: [],
                    devices: []
                }
            });
        }

        // Convert to array if it's an object
        let statsArray = Array.isArray(stats) ? stats : Object.values(stats);

        // Filter by date range if provided
        if (startDate && endDate) {
            statsArray = statsArray.filter(stat => {
                const statDate = new Date(stat.timestamp);
                return statDate >= new Date(startDate) && statDate <= new Date(endDate);
            });
        }

        // Calculate analytics
        const totalVisitors = statsArray.length;
        const uniqueVisitors = new Set(statsArray.map(stat => stat.ip)).size;
        const pageViews = statsArray.length;

        // Group by country
        const countryStats = statsArray.reduce((acc, stat) => {
            acc[stat.country] = (acc[stat.country] || 0) + 1;
            return acc;
        }, {});

        // Group by browser
        const browserStats = statsArray.reduce((acc, stat) => {
            acc[stat.browser] = (acc[stat.browser] || 0) + 1;
            return acc;
        }, {});

        // Group by device type
        const deviceStats = statsArray.reduce((acc, stat) => {
            const device = stat.isMobile ? 'Mobile' : 'Desktop';
            acc[device] = (acc[device] || 0) + 1;
            return acc;
        }, {});

        // Group by OS
        const osStats = statsArray.reduce((acc, stat) => {
            acc[stat.os] = (acc[stat.os] || 0) + 1;
            return acc;
        }, {});

        // Daily visitors for charts
        const dailyStats = statsArray.reduce((acc, stat) => {
            const date = stat.date || new Date(stat.timestamp).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Hourly distribution
        const hourlyStats = statsArray.reduce((acc, stat) => {
            const hour = stat.hour || new Date(stat.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        // Top pages
        const pageStats = statsArray.reduce((acc, stat) => {
            const page = stat.page || stat.url || 'Unknown';
            acc[page] = (acc[page] || 0) + 1;
            return acc;
        }, {});

        // Average load time
        const loadTimes = statsArray.filter(stat => stat.loadTime).map(stat => stat.loadTime);
        const avgLoadTime = loadTimes.length > 0 ? 
            loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0;

        const analyticsData = {
            overview: {
                totalVisitors,
                uniqueVisitors,
                pageViews,
                avgLoadTime: Math.round(avgLoadTime),
                bounceRate: 0 // Calculate based on your needs
            },
            countries: Object.entries(countryStats)
                .map(([country, count]) => ({ country, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            browsers: Object.entries(browserStats)
                .map(([browser, count]) => ({ browser, count }))
                .sort((a, b) => b.count - a.count),
            devices: Object.entries(deviceStats)
                .map(([device, count]) => ({ device, count })),
            os: Object.entries(osStats)
                .map(([os, count]) => ({ os, count }))
                .sort((a, b) => b.count - a.count),
            daily: Object.entries(dailyStats)
                .map(([date, count]) => ({ date, visitors: count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date)),
            hourly: Array.from({ length: 24 }, (_, hour) => ({
                hour,
                visitors: hourlyStats[hour] || 0
            })),
            pages: Object.entries(pageStats)
                .map(([page, count]) => ({ page, views: count }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10)
        };

        return NextResponse.json({
            success: true,
            data: analyticsData
        });

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

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}