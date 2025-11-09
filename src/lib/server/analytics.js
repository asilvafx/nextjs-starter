// src/lib/server/analytics.js
'use server';

import DBService from '@/data/rest.db.js';

/**
 * Get web statistics and analytics data
 * Server-side function to fetch visitor analytics
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date for filtering
 * @param {string} options.endDate - End date for filtering
 * @returns {Promise<Object>} Analytics data
 */
export async function getWebStats(options = {}) {
    const { startDate, endDate } = options;

    try {
        // Get all web stats
        const stats = await DBService.readAll('web_stats');

        if (!stats) {
            return {
                success: true,
                data: {
                    overview: {
                        totalVisitors: 0,
                        uniqueVisitors: 0,
                        pageViews: 0,
                        avgLoadTime: 0,
                        bounceRate: 0
                    },
                    countries: [],
                    browsers: [],
                    devices: [],
                    os: [],
                    daily: [],
                    hourly: [],
                    pages: []
                }
            };
        }

        // Convert to array if it's an object
        let statsArray = Array.isArray(stats) ? stats : Object.values(stats);

        // Filter by date range if provided
        if (startDate && endDate) {
            statsArray = statsArray.filter((stat) => {
                const statDate = new Date(stat.timestamp);
                return statDate >= new Date(startDate) && statDate <= new Date(endDate);
            });
        }

        // Calculate analytics
        const totalVisitors = statsArray.length;
        const uniqueVisitors = new Set(statsArray.map((stat) => stat.ip)).size;
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
        const loadTimes = statsArray.filter((stat) => stat.loadTime).map((stat) => stat.loadTime);
        const avgLoadTime =
            loadTimes.length > 0 ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0;

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
            devices: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
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

        return {
            success: true,
            data: analyticsData
        };
    } catch (error) {
        console.error('Error fetching web stats:', error);
        return {
            success: false,
            error: 'Failed to retrieve analytics data',
            message: error.message
        };
    }
}

/**
 * Get Google Analytics settings
 * @returns {Promise<Object>} Google Analytics settings
 */
export async function getAnalyticsSettings() {
    try {
        const settings = await DBService.readAll('analytics_settings');

        if (!settings) {
            return {
                success: true,
                data: {
                    enabled: false,
                    apiKey: ''
                }
            };
        }

        // Convert to array and get first item
        const settingsArray = Array.isArray(settings) ? settings : Object.values(settings);
        const data = settingsArray[0] || { enabled: false, apiKey: '' };

        return {
            success: true,
            data: {
                enabled: data.enabled || false,
                apiKey: data.apiKey || ''
            }
        };
    } catch (error) {
        console.error('Error fetching analytics settings:', error);
        return {
            success: false,
            error: 'Failed to retrieve analytics settings',
            message: error.message
        };
    }
}

/**
 * Save Google Analytics settings
 * @param {Object} settings - Settings to save
 * @param {boolean} settings.enabled - Whether Google Analytics is enabled
 * @param {string} settings.apiKey - Google Analytics API key
 * @returns {Promise<Object>} Save result
 */
export async function saveAnalyticsSettings(settings) {
    try {
        const { enabled, apiKey } = settings;

        // Check if settings already exist
        const existingSettings = await DBService.readAll('analytics_settings');
        const settingsArray = existingSettings
            ? Array.isArray(existingSettings)
                ? existingSettings
                : Object.values(existingSettings)
            : [];

        const settingsData = {
            enabled: enabled || false,
            apiKey: apiKey || '',
            updatedAt: new Date().toISOString()
        };

        let result;
        if (settingsArray.length > 0) {
            // Update existing settings
            const existingId = settingsArray[0].id;
            result = await DBService.update(existingId, settingsData, 'analytics_settings');
        } else {
            // Create new settings
            settingsData.createdAt = new Date().toISOString();
            result = await DBService.create(settingsData, 'analytics_settings');
        }

        if (!result) {
            return {
                success: false,
                error: 'Failed to save analytics settings'
            };
        }

        return {
            success: true,
            data: settingsData
        };
    } catch (error) {
        console.error('Error saving analytics settings:', error);
        return {
            success: false,
            error: 'Failed to save analytics settings',
            message: error.message
        };
    }
}
