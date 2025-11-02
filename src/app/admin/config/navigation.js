// @/app/admin/config/navigation.js

import {
    BrainCircuit,
    Code,
    Database,
    Frame,
    Gauge,
    Images,
    Megaphone,
    PieChart,
    Settings,
    Store,
    Users,
    Waypoints,
    Wrench
} from 'lucide-react';

export const navigation = {
    Home: [
        {
            title: 'Dashboard',
            url: '/admin',
            icon: Gauge
        },
        {
            title: 'Analytics & Reports',
            url: '/admin/analytics',
            icon: PieChart
        }
    ],
    Main: [
        {
            title: 'Access',
            url: '#',
            icon: Users,
            items: [
                {
                    title: 'Users',
                    url: '/admin/access/users'
                },
                {
                    title: 'Roles & Permissions',
                    url: '/admin/access/roles'
                }
            ]
        },
        {
            title: 'Store',
            url: '#',
            icon: Store,
            items: [
                {
                    title: 'Orders',
                    url: '/admin/store/orders'
                },
                {
                    title: 'Catalog',
                    url: '/admin/store/catalog'
                },
                {
                    title: 'Categories',
                    url: '/admin/store/categories'
                },
                {
                    title: 'Collections',
                    url: '/admin/store/collections'
                },
                {
                    title: 'Attributes',
                    url: '/admin/store/attributes'
                },
                {
                    title: 'Customers',
                    url: '/admin/store/customers'
                },
                {
                    title: 'Coupons',
                    url: '/admin/store/coupons'
                },
                {
                    title: 'Store Settings',
                    url: '/admin/store/settings'
                }
            ]
        },
        {
            title: 'Media',
            url: '/admin/media',
            icon: Images
        },
        {
            title: 'Workspace',
            url: '#',
            icon: Waypoints,
            items: [
                {
                    title: 'Agenda',
                    url: '/admin/workspace/agenda'
                },
                {
                    title: 'Task Board',
                    url: '/admin/workspace/tasks'
                },
                {
                    title: 'Schedule',
                    url: '/admin/workspace/schedule'
                }
            ]
        },
        {
            title: 'Marketing',
            url: '#',
            icon: Megaphone,
            items: [
                {
                    title: 'Newsletter',
                    url: '/admin/marketing/newsletter'
                },
                {
                    title: 'Subscribers',
                    url: '/admin/marketing/subscribers'
                }
            ]
        },
        {
            title: 'Blocks',
            url: '/admin/blocks',
            icon: Gauge
        }
    ],
    Developer: [
        {
            title: 'Database',
            url: '/admin/developer/database',
            icon: Database
        },
        {
            title: 'AI Agent',
            url: '/admin/developer/ai',
            icon: BrainCircuit
        },
        {
            title: 'API',
            url: '#',
            icon: Code,
            items: [
                {
                    title: 'Endpoints',
                    url: '/admin/developer/endpoints'
                },
                {
                    title: 'Create API Key',
                    url: '/admin/developer/endpoints/new-key'
                }
            ]
        }
        ,
        {
            title: 'Cronjobs',
            url: '/admin/developer/cronjobs'
        }
    ],
    System: [
        {
            title: 'Settings',
            url: '/admin/system/settings',
            icon: Settings
        },
        {
            title: 'Integrations',
            url: '/admin/system/integrations',
            icon: Frame
        },
        {
            title: 'Maintenance',
            url: '/admin/system/maintenance',
            icon: Wrench
        }
    ]
};

export const findBreadcrumbPath = (pathname) => {
    const paths = [];

    // Always start with Dashboard for any admin route
    if (pathname.startsWith('/admin')) {
        paths.push({
            title: 'Dashboard',
            url: '/admin'
        });
    }

    // Function to search for matching routes
    const findRoute = (items) => {
        for (const section in items) {
            const sectionItems = items[section];
            for (const item of sectionItems) {
                // Check main item
                if (item.url === pathname) {
                    paths.push({
                        title: item.title,
                        url: item.url
                    });
                    return true;
                }
                // Check subitems
                if (item.items) {
                    for (const subItem of item.items) {
                        if (subItem.url === pathname) {
                            // Add parent item first if it's not a placeholder URL
                            if (item.url !== '#') {
                                paths.push({
                                    title: item.title,
                                    url: item.url
                                });
                            }
                            // Add the matching subitem
                            paths.push({
                                title: subItem.title,
                                url: subItem.url
                            });
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    findRoute(navigation);
    return paths;
};
