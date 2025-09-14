// app/dashboard/pages/page.jsx
"use client"

import { EmptyState } from '../components/common/Common';
const DashboardPages = () => (
    <div className="fade-in">
        <div className="dashboard-card-header">
            <div>
                <h1 className="dashboard-card-title">Pages Management</h1>
                <p className="dashboard-card-subtitle">Manage website content and pages</p>
            </div>
            <button className="button primary">Create Page</button>
        </div>

        <div className="dashboard-card">
            <EmptyState
                icon="📄"
                title="Content Management"
                description="Create and manage website pages, blog posts, and content."
                actionButton={<button className="button primary">Create Your First Page</button>}
            />
        </div>
    </div>
);

export default DashboardPages;
