// app/dashboard/components/layout/Sidebar.jsx
"use client"

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDashboard } from '@/app/dashboard/context/LayoutProvider';

const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen } = useDashboard();

    const navigateUser = (route) => {
        setActiveSection(route);
        setSidebarOpen(false);
        router.push(`/dashboard/${route}`);
    }

    // Navigation items
    const navigationSections = [
        {
            title: 'Main',
            items: [
                { id: '', label: 'Overview', icon: '📊' },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
            ]
        },
        {
            title: 'Management',
            items: [
                { id: 'access', label: 'Access', icon: '👥', badge: '12' },
                { id: 'store', label: 'Store', icon: '📦' },
                { id: 'orders', label: 'Orders', icon: '🛒', badge: '3' },
                { id: 'customers', label: 'Customers', icon: '👤' }
            ]
        },
        {
            title: 'Content',
            items: [
                { id: 'gallery', label: 'Gallery', icon: '🖼️' },
                { id: 'pages', label: 'Pages', icon: '📄' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
            ]
        }
    ];

    // Effect to set active section based on current pathname
    useEffect(() => {
        // Extract the section from the pathname (e.g., "/dashboard/shop" -> "shop")
        const pathSegments = pathname.split('/');
        const currentSection = pathSegments[2] || ''; // Index 2 because [0]="", [1]="dashboard", [2]="section"

        // Check if the current section exists in any of the navigation sections
        const sectionExists = navigationSections.some(section =>
            section.items.some(item => item.id === currentSection)
        );

        // Only set active section if it exists in navigation and is different from current
        if (sectionExists && currentSection !== activeSection) {
            setActiveSection(currentSection);
        }
    }, [pathname, activeSection, setActiveSection, navigationSections]);

    return (
        <>
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`dashboard-sidebar ${!sidebarOpen ? 'mobile-hidden' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">A</div>
                        <div className="sidebar-title">Admin Panel</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="sidebar-section">
                            <div className="sidebar-section-title">{section.title}</div>
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        navigateUser(item.id);
                                    }}
                                    className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">{item.icon}</span>
                                    <span className="sidebar-text">{item.label}</span>
                                    {item.badge && (
                                        <span className="sidebar-badge">{item.badge}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
