// app/shop/context/LayoutProvider.jsx
'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { initializeVisitorTracking } from '@/lib/client/visitor-tracking';

import '@/app/main/styles.css';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Initialize visitor tracking once, regardless of auth status
        const initTracking = async () => {
            try {
                await initializeVisitorTracking();
            } catch (error) {
                console.error('Failed to initialize main visitor tracking:', error);
            }
        };

        initTracking();
    }, []);

    useEffect(() => {
        // Track page views on subsequent renders
        if (isFirstRender.current) {
            return;
        }
        if (window.VisitorTracker) {
            isFirstRender.current = true;
            window.VisitorTracker.trackPageView();
        }
    }, []);

    return (
        <LayoutContext.Provider value={{}}>
            <div className="container">
                <div className="screen">{children}</div>
            </div>
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a Provider');
    }
    return context;
};
