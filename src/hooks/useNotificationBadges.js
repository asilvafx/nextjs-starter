// Hook for managing notification badge refresh
// /hooks/useNotificationBadges.js

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getNavigationSectionCounts } from '@/lib/server/admin.js';

export function useNotificationBadges() {
    const { user } = useAuth();
    const [badges, setBadges] = useState({
        store: 0,
        storeOrders: 0,
        system: 0,
        marketing: 0
    });
    const [loading, setLoading] = useState(true);

    // Load all badge counts
    const loadBadges = useCallback(async () => {
        try {
            const sections = ['store', 'system', 'marketing'];
            const result = await getNavigationSectionCounts(sections, user?.email || null);
            
            if (result.success) {
                setBadges(prev => ({
                    ...prev,
                    ...result.data,
                    storeOrders: result.data.store || 0 // Orders same as store
                }));
            }
        } catch (error) {
            console.error('Error loading notification badges:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    // Load badges on mount and user change
    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    // Refresh badges periodically (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(loadBadges, 30000);
        return () => clearInterval(interval);
    }, [loadBadges]);

    // Force refresh function (call after order status changes, etc.)
    const refreshBadges = useCallback(async () => {
        setLoading(true);
        await loadBadges();
    }, [loadBadges]);

    // Clear specific badge type
    const clearBadge = useCallback((section) => {
        setBadges(prev => ({
            ...prev,
            [section]: 0,
            // If clearing store, also clear storeOrders
            ...(section === 'store' && { storeOrders: 0 }),
            // If clearing storeOrders, also clear store
            ...(section === 'storeOrders' && { store: 0 })
        }));
    }, []);

    return {
        badges,
        loading,
        refreshBadges,
        clearBadge,
        // Helper functions for specific sections
        getStoreBadgeCount: () => badges.store,
        getSystemBadgeCount: () => badges.system,
        getMarketingBadgeCount: () => badges.marketing
    };
}

// Context for sharing badge state across components
import { createContext, useContext } from 'react';

const NotificationBadgeContext = createContext();

export function NotificationBadgeProvider({ children }) {
    const badgeState = useNotificationBadges();

    return (
        <NotificationBadgeContext.Provider value={badgeState}>
            {children}
        </NotificationBadgeContext.Provider>
    );
}

export function useNotificationBadgeContext() {
    const context = useContext(NotificationBadgeContext);
    if (!context) {
        throw new Error('useNotificationBadgeContext must be used within NotificationBadgeProvider');
    }
    return context;
}