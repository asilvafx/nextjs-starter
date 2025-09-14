// app/dashboard/components/sections/OverviewSection.jsx
"use client"
import { StatsCard, DataTable, StatusBadge } from '../common/Common';

const OverviewShop = ({ statsCards, currentData }) => {
    return (
        <div className="fade-in">
            <div className="dashboard-card-header">
                <div>
                    <h1 className="dashboard-card-title">Store Overview</h1>
                    <p className="dashboard-card-subtitle">Welcome back! Here's what's happening.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statsCards.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        trend={stat.trend}
                    />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <h2 className="dashboard-card-title">Quick Actions</h2>
                </div>
                <div className="quick-actions">
                    <div className="quick-action">
                        <div className="quick-action-icon">+</div>
                        <div className="quick-action-title">Add Product</div>
                        <div className="quick-action-description">Create a new product listing</div>
                    </div>
                    <div className="quick-action">
                        <div className="quick-action-icon">👤</div>
                        <div className="quick-action-title">Add User</div>
                        <div className="quick-action-description">Create new user account</div>
                    </div>
                    <div className="quick-action">
                        <div className="quick-action-icon">📊</div>
                        <div className="quick-action-title">View Reports</div>
                        <div className="quick-action-description">Generate analytics reports</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="analytics-grid">
                <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <h3 className="dashboard-card-title">Recent Orders</h3>
                        <span className="dashboard-card-action">View All</span>
                    </div>
                     <DataTable headers={['Order ID', 'Customer', 'Product', 'Amount', 'Status']}>
                        {currentData.recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td data-label="Order ID">#{order.id}</td>
                                <td data-label="Customer">{order.customer}</td>
                                <td data-label="Product">{order.product}</td>
                                <td data-label="Amount">{order.amount}</td>
                                <td data-label="Status">
                                    <StatusBadge status={order.status} />
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>

                <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <h3 className="dashboard-card-title">Recent Users</h3>
                        <span className="dashboard-card-action">View All</span>
                    </div>
                   <DataTable headers={['Name', 'Email', 'Role', 'Status']}>
                        {currentData.recentUsers.map((user) => (
                            <tr key={user.id}>
                                <td data-label="Name">{user.name}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Role">{user.role}</td>
                                <td data-label="Status">
                                    <StatusBadge status={user.status} />
                                </td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default OverviewShop;
