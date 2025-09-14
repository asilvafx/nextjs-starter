"use client"
import { useState } from 'react';
import { Clock, CheckCircle, Truck, Package, XCircle, RotateCcw, List } from 'lucide-react';

const OrdersFilterTabs = ({ orders, activeFilter, onFilterChange }) => {
    const getOrderCount = (status) => {
        if (status === 'all') return orders.length;
        return orders.filter(order => order.status === status).length;
    };

    const filterTabs = [
        {
            id: 'all',
            label: 'All',
            icon: List,
            count: getOrderCount('all'),
            color: 'gray'
        },
        {
            id: 'pending',
            label: 'Pending',
            icon: Clock,
            count: getOrderCount('pending'),
            color: 'yellow'
        },
        {
            id: 'confirmed',
            label: 'Confirmed',
            icon: CheckCircle,
            count: getOrderCount('confirmed'),
            color: 'blue'
        },
        {
            id: 'shipped',
            label: 'Shipped',
            icon: Truck,
            count: getOrderCount('shipped'),
            color: 'purple'
        },
        {
            id: 'delivered',
            label: 'Delivered',
            icon: CheckCircle,
            count: getOrderCount('delivered'),
            color: 'green'
        },
        {
            id: 'cancelled',
            label: 'Cancelled',
            icon: XCircle,
            count: getOrderCount('cancelled'),
            color: 'red'
        },
        {
            id: 'refunded',
            label: 'Refunded',
            icon: RotateCcw,
            count: getOrderCount('refunded'),
            color: 'orange'
        }
    ];

    const getTabClasses = (tab) => {
        const baseClasses = "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer";

        const colorClasses = {
            gray: {
                active: "bg-gray-100 text-gray-900 border border-gray-300",
                inactive: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            },
            yellow: {
                active: "bg-yellow-100 text-yellow-900 border border-yellow-300",
                inactive: "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50"
            },
            blue: {
                active: "bg-blue-100 text-blue-900 border border-blue-300",
                inactive: "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
            },
            indigo: {
                active: "bg-indigo-100 text-indigo-900 border border-indigo-300",
                inactive: "text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
            },
            purple: {
                active: "bg-purple-100 text-purple-900 border border-purple-300",
                inactive: "text-purple-600 hover:text-purple-900 hover:bg-purple-50"
            },
            green: {
                active: "bg-green-100 text-green-900 border border-green-300",
                inactive: "text-green-600 hover:text-green-900 hover:bg-green-50"
            },
            red: {
                active: "bg-red-100 text-red-900 border border-red-300",
                inactive: "text-red-600 hover:text-red-900 hover:bg-red-50"
            },
            orange: {
                active: "bg-orange-100 text-orange-900 border border-orange-300",
                inactive: "text-orange-600 hover:text-orange-900 hover:bg-orange-50"
            }
        };

        const isActive = activeFilter === tab.id;
        const colorSet = colorClasses[tab.color] || colorClasses.gray;

        return `${baseClasses} ${isActive ? colorSet.active : colorSet.inactive}`;
    };

    return (
        <div className="mb-6">
            <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-wrap gap-2">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onFilterChange(tab.id)}
                                className={getTabClasses(tab)}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    activeFilter === tab.id
                                        ? 'bg-white bg-opacity-80'
                                        : 'bg-gray-100'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active filter indicator */}
            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    {activeFilter === 'all'
                        ? `Showing a total results of (${orders.length})`
                        : `Filters: ${filterTabs.find(tab => tab.id === activeFilter)?.label} (${getOrderCount(activeFilter)})`
                    }
                </div>
                {activeFilter !== 'all' && (
                    <button
                        onClick={() => onFilterChange('all')}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrdersFilterTabs;
