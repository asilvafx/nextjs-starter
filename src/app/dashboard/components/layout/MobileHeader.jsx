// app/dashboard/components/layout/MobileHeader.jsx
"use client"

import { useDashboard } from '@/app/dashboard/context/LayoutProvider';

const MobileHeader = () => {
    const { sidebarOpen, setSidebarOpen } = useDashboard();

    return (
        <div className="dashboard-mobile-header">
            <div className="mobile-header-content">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">A</div>
                    <div className="sidebar-title">Admin Panel</div>
                </div>
                <button
                    className="mobile-menu-button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MobileHeader;
