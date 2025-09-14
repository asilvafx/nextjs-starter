// app/dashboard/context/LayoutProvider.jsx
"use client"

import {useSession} from 'next-auth/react';
import { createContext, useContext, useState } from 'react';

import Sidebar from '../components/layout/Sidebar';
import MobileHeader from '@/app/dashboard/components/layout/MobileHeader';

import '../styles.css';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    const { data: session, status } = useSession();

    const layoutValue = {
        session,
        status,
        isAuthenticated: !!session,
        user: session?.user || null
    };

    return (
        <LayoutContext.Provider value={{
            sidebarOpen,
            setSidebarOpen,
            activeSection,
            setActiveSection,
            layoutValue
        }}>
            <div className="dashboard-layout">
                <div className="dashboard-container">
                    <main className="dashboard-main">
                        <MobileHeader />
                        <Sidebar />
                        <div className="dashboard-content">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </LayoutContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useDashboard must be used within a LayoutProvider');
    }
    return context;
};
