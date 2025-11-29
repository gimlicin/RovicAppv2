import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Package2, BarChart3, Settings, GlobeIcon, HomeIcon, LogOut, ShoppingCart, User, History, Wallet, Users, FileText, Activity } from 'lucide-react';
import AppLogo from './app-logo';

// Super Admin navigation items - Full system access
const superAdminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/super-admin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Users',
        href: '/super-admin/users',
        icon: Users,
    },
    {
        title: 'Activity Logs',
        href: '/super-admin/activity-logs',
        icon: Activity,
    },
    {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Products',
        href: '/admin/products',
        icon: Package2,
    },
    {
        title: 'Categories',
        href: '/super-admin/categories',
        icon: BarChart3,
    },
    {
        title: 'Payment Settings',
        href: '/super-admin/payment-settings',
        icon: Wallet,
    },
    {
        title: 'Go to Website',
        href: '/',
        icon: GlobeIcon,
    },
];

// Admin navigation items - Orders & Products ONLY
const adminNavItems: NavItem[] = [
    {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Products',
        href: '/admin/products',
        icon: Package2,
    },
    {
        title: 'Go to Website',
        href: '/',
        icon: GlobeIcon,
    },
];

// Customer navigation items
const customerNavItems: NavItem[] = [
    {
        title: 'My Orders',
        href: '/my-orders',
        icon: ShoppingCart,
    },
    {
        title: 'Order History',
        href: '/my-orders',
        icon: History,
    },
    {
        title: 'Go to Shop',
        href: '/',
        icon: GlobeIcon,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface PageProps extends Record<string, any> {
    auth: {
        user: User;
    };
}

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    
    // Determine navigation items based on user role
    const getNavItems = () => {
        if (user?.role === 'super_admin') {
            return superAdminNavItems;
        } else if (user?.role === 'admin') {
            return adminNavItems;
        } else {
            return customerNavItems;
        }
    };

    // Determine home link based on user role
    const getHomeLink = () => {
        if (user?.role === 'super_admin') {
            return '/super-admin/dashboard';
        } else if (user?.role === 'admin') {
            return '/admin/orders'; // Admin goes directly to orders
        } else {
            return '/';
        }
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={getHomeLink()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={getNavItems()} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
