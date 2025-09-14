// app/dashboard/analytics/page.jsx
"use client"

import { EmptyState } from '../components/common/Common';

const DashboardAnalytics = () => (
    <div className="fade-in">
        <div className="dashboard-card-header">
            <div>
                <h1 className="dashboard-card-title">Analytics Dashboard</h1>
                <p className="dashboard-card-subtitle">Track performance and insights</p>
            </div>
        </div>

        <div className="analytics-grid">
            <div className="dashboard-card">
                <h3 className="dashboard-card-title">Traffic Overview</h3>
                <div className="chart-container">
                    <EmptyState
                        icon="📊"
                        description="Chart will be displayed here"
                    />
                </div>
            </div>

            <div className="dashboard-card">
                <h3 className="dashboard-card-title">Revenue Trends</h3>
                <div className="chart-container">
                    <EmptyState
                        icon="💹"
                        description="Revenue chart will be displayed here"
                    />
                </div>
            </div>
        </div>
    </div>
);

export default DashboardAnalytics;
