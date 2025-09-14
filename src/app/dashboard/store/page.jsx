// app/dashboard/shop/page.jsx
"use client"
import { useState, useEffect, useMemo } from 'react';
import { getAll } from '@/lib/query.js';
import CatalogManagement from '../components/sections/CatalogManagement';
import CategoriesManagement from '../components/sections/CategoriesManagement';
import CollectionsManagement from '../components/sections/CollectionsManagement';
import toast, { Toaster } from 'react-hot-toast';
import {
    Package,
    Tags,
    Star,
    ShoppingBag,
    TrendingUp,
    DollarSign,
    Eye,
    Plus,
    BarChart3
} from 'lucide-react';

const DashboardStore = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [quickStats, setQuickStats] = useState({
        totalProducts: 0,
        totalServices: 0,
        activeItems: 0,
        totalRevenue: 0,
        categories: 0,
        collections: 0
    });
    const [statsLoaded, setStatsLoaded] = useState(false); 

    // Load quick stats only once
    useEffect(() => {
        if (!statsLoaded) {
            loadQuickStats();
        }
    }, [statsLoaded]);

    const loadQuickStats = async () => {
        try {
            const [itemsResponse, categoriesResponse, collectionsResponse] = await Promise.all([
                getAll('catalog'),
                getAll('categories'),
                getAll('collections')
            ]);

            if (itemsResponse?.success && categoriesResponse?.success && collectionsResponse?.success) {
                const items = itemsResponse.data;
                const stats = {
                    totalProducts: items.filter(item => item.item_type === 'product').length,
                    totalServices: items.filter(item => item.item_type === 'service').length,
                    activeItems: items.filter(item => item.isActive).length,
                    totalRevenue: items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0),
                    categories: categoriesResponse.data.length,
                    collections: collectionsResponse.data.length
                };
                setQuickStats(stats);
                setStatsLoaded(true);
            }
        } catch (err) {
            console.error('Error loading quick stats:', err);
            toast.error('Failed to load dashboard statistics');
        }
    };

    const statsCards = useMemo(() => [
        {
            title: 'Total Products',
            value: quickStats.totalProducts,
            icon: Package,
            color: 'bg-blue-500',
            change: '+12%',
            changeType: 'positive'
        },
        {
            title: 'Total Services',
            value: quickStats.totalServices,
            icon: ShoppingBag,
            color: 'bg-green-500',
            change: '+8%',
            changeType: 'positive'
        },
        {
            title: 'Active Items',
            value: quickStats.activeItems,
            icon: TrendingUp,
            color: 'bg-purple-500',
            change: `${quickStats.totalProducts + quickStats.totalServices} total`,
            changeType: 'neutral'
        },
        {
            title: 'Est. Value',
            value: `$${quickStats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-yellow-500',
            change: '+15%',
            changeType: 'positive'
        },
        {
            title: 'Categories',
            value: quickStats.categories,
            icon: Tags,
            color: 'bg-cyan-500',
            change: 'Organize',
            changeType: 'neutral'
        },
        {
            title: 'Collections',
            value: quickStats.collections,
            icon: Star,
            color: 'bg-pink-500',
            change: 'Featured',
            changeType: 'neutral'
        }
    ], [quickStats]);

    const tabNavigation = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'catalog', label: 'Catalog', icon: Package },
        { id: 'categories', label: 'Categories', icon: Tags },
        { id: 'collections', label: 'Collections', icon: Star }
    ];

    // Handle quick actions navigation
    const handleQuickAction = (tabId) => {
        setActiveTab(tabId);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewContent statsCards={statsCards} onQuickAction={handleQuickAction} />;
            case 'catalog':
                return <CatalogContent />;
            case 'categories':
                return <CategoriesContent />;
            case 'collections':
                return <CollectionsContent />;
            default:
                return <OverviewContent statsCards={statsCards} onQuickAction={handleQuickAction} />;
        }
    };

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                        border: '1px solid #374151',
                        borderRadius: '12px'
                    }
                }}
            />

            <div className="fade-in">
                <div className="dashboard-card-header">
                    <div>
                        <h1 className="dashboard-card-title">Store Management</h1>
                        <p className="dashboard-card-subtitle">Manage your products, services, and more</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="my-4">
                    <nav className="flex flex-wrap gap-2 space-x-1 p-1 rounded-lg">
                        {tabNavigation.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-neutral-100 text-black shadow-sm'
                                            : 'bg-transparent border text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Icon color={activeTab === tab.id ? "black" : "white"} size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                {renderTabContent()}
            </div>
        </>
    );
};

// Overview Content Component
const OverviewContent = ({ statsCards, onQuickAction }) => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="dashboard-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-100">{card.value || '-'}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm ${
                                        card.changeType === 'positive'
                                            ? 'text-green-600'
                                            : card.changeType === 'negative'
                                                ? 'text-red-600'
                                                : 'text-gray-500'
                                    }`}>
                                        {card.change}
                                    </span>
                                </div>
                            </div>
                            <div className={`${card.color} p-3 rounded-lg`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Quick Actions</h2>
            </div>
            <div className="quick-actions">
                <div
                     className="quick-action"
                     onClick={() => onQuickAction('products')}
                >
                    <div className="quick-action-icon">+</div>
                    <div className="quick-action-title">Add Item</div>
                    <div className="quick-action-description">Create a new product and service listing</div>
                </div>
                <div
                    className="quick-action"
                    onClick={() => onQuickAction('categories')}
                >
                    <div className="quick-action-icon">👤</div>
                    <div className="quick-action-title">Manage Categories</div>
                    <div className="quick-action-description">Manage and view your categories</div>
                </div>
                <div
                    className="quick-action"
                    onClick={() => onQuickAction('collections')}
                >
                    <div className="quick-action-icon">📊</div>
                    <div className="quick-action-title">Manage Collections</div>
                    <div className="quick-action-description">Manage and view your collections</div>
                </div>
            </div>

        </div>
    </div>
);

// Memoized components to prevent unnecessary re-renders
const CatalogContent = () => <CatalogManagement />;
const CategoriesContent = () => <CategoriesManagement />;
const CollectionsContent = () => <CollectionsManagement />;

export default DashboardStore;
