// app/dashboard/customers/DashboardCustomers.jsx
"use client"

import { EmptyState } from '../components/common/Common';
const DashboardCustomers = () => (
    <div className="fade-in">
        <div className="dashboard-card-header">
            <div>
                <h1 className="dashboard-card-title">Customers</h1>
                <p className="dashboard-card-subtitle">Manage customer relationships</p>
            </div>
        </div>

        <div className="dashboard-card">
            <EmptyState
                icon="👤"
                title="Customer Management"
                description="View customer profiles, order history, and communication logs."
            />
        </div>
    </div>
);

export default DashboardCustomers;
