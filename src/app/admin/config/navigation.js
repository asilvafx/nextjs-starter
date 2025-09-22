// @/app/admin/config/navigation.js

import {
  Frame,
  PieChart,
  Users,
} from "lucide-react"

export const navigation = {
  Home: [
    {
      title: "Overview",
      url: "/admin",
      icon: Frame, 
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: PieChart, 
    },
  ],
  Main: [
    {
      title: "Access",
      url: "#",
      icon: Users, 
      items: [
        {
          title: "Users",
          url: "/admin/access/users", 
        },
        {
          title: "Roles",
          url: "/admin/access/roles", 
        },
      ],
    },
    {
      title: "Store",
      url: "#",
      icon: Frame, 
      items: [
        {
          title: "Orders",
          url: "/admin/store/orders", 
        },
        {
          title: "Catalog",
          url: "/admin/store/catalog", 
        },
        {
          title: "Categories",
          url: "/admin/store/categories", 
        },
        {
          title: "Collections",
          url: "/admin/store/collections", 
        },
        {
          title: "Customers",
          url: "/admin/store/customers", 
        },
        {
          title: "Settings",
          url: "/admin/store/settings", 
        },
      ],
    },
    {
      title: "Gallery",
      url: "/admin/gallery",
      icon: Frame, 
    }, 
    {
      title: "Workspace",
      url: "#",
      icon: Frame, 

      items: [
        {
          title: "Agenda",
          url: "/admin/planning/agenda",
        },
        {
          title: "Tasks",
          url: "/admin/planning/tasks",
        },
        {
          title: "Schedule",
          url: "/admin/planning/schedule",
        },
      ]
    },
    {
      title: "Marketing",
      url: "#",
      icon: Frame, 

      items: [
        {
          title: "Newsletter",
          url: "/admin/marketing/newsletter",
        },
        {
          title: "Subscribers",
          url: "/admin/marketing/subscribers",
        },
      ]
    },
    {
      title: "API",
      url: "#",
      icon: Frame, 

      items: [
        {
          title: "Database",
          url: "/admin/api/database",
        },
        {
          title: "Keys",
          url: "/admin/api/keys",
        },
      ]
    },
  ],
  System: [
    {
      title: "Settings",
      url: "/admin/system/settings",
      icon: Frame, 
    },
    {
      title: "Maintenance",
      url: "/admin/system/maintenance",
      icon: Frame, 
    },
  ],
}

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