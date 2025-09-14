// app/dashboard/page.jsx
"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Section Components
import OverviewShop from './components/sections/OverviewShop';

import { LoadingSpinner } from './components/common/Common';

// Custom Hooks
import { useDashboardData, useStatsCalculation } from './hooks/useDashboardData';

const DashboardPage = () => {
    const t = useTranslations('HomePage');

    // Fetch dashboard data
    const { data: currentData, loading, error } = useDashboardData();
    const { statsCards } = useStatsCalculation(currentData);

    // Render content based on active section
    const renderContent = () => {
        return <OverviewShop statsCards={statsCards} currentData={currentData} />
    };

    if (error) {
        return (
            <div className="dashboard-card">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <h3 className="empty-state-title">Error Loading Dashboard</h3>
                    <p className="empty-state-description">{error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return renderContent();
};

export default DashboardPage;
