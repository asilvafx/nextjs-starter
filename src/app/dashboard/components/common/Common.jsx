// app/dashboard/components/common/Common.jsx
"use client";

import React from 'react';





// app/dashboard/components/common/Common.jsx


export const StatsCard = ({ title, value, icon, trend }) => (
    <div className='stat-card'>
        <div className='stat-content'>
            <div className='stat-header'>
                <div className='stat-title'>{title}</div>
                <div className='stat-icon'>{icon}</div>
            </div>
            <div className='stat-value'>{value}</div>
            {trend && (
                <div className={`stat-change ${trend?.direction}`}>
                    <span>{trend?.direction === 'positive' ? '↗' : trend?.direction === 'negative' ? '↘' : '→'}</span>
                    <span>{trend?.value}%</span>
                </div>
            )}
        </div>
    </div>
);

// app/dashboard/components/common/DataTable.jsx
export const DataTable = ({ headers, children, className = '' }) => (
    <div className={`dashboard-table-container ${className}`}>
        <table className='dashboard-table'>
            <thead className='table-header'>
                <tr>
                    {headers.map((header, index) => (
                        <th key={index}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody className='table-body'>{children}</tbody>
        </table>
    </div>
);

// app/dashboard/components/common/EmptyState.jsx
export const EmptyState = ({ icon, title, description, actionButton }) => (
    <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {actionButton}
    </div>
);

// app/dashboard/components/common/LoadingSpinner.jsx
export const LoadingSpinner = () => (
    <div className="loading-overlay">
        <div className="loading-spinner"></div>
    </div>
);

// app/dashboard/components/common/StatusBadge.jsx
export const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': case 'delivered': return 'bg-green-100 text-green-800';
            case 'processing': case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': case 'refunded': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`status-badge ${getStatusColor(status)}`}>
      {status || 'unknown'}
    </span>
    );
};

// app/dashboard/components/common/ActionButtons.jsx
export const ActionButtons = ({ onEdit, onView, onDelete, editTitle = "Edit", viewTitle = "View", deleteTitle = "Delete" }) => (
    <div className="action-buttons">
        {onEdit && (
            <button className="action-button primary" title={editTitle} onClick={onEdit}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        )}
        {onView && (
            <button className="action-button" title={viewTitle} onClick={onView}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>
        )}
        {onDelete && (
            <button className="action-button danger" title={deleteTitle} onClick={onDelete}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        )}
    </div>
);
