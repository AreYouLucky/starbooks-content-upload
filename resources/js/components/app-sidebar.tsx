import { LayoutDashboard } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
];

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-slate-200 [&>[data-sidebar=sidebar]]:bg-white"
        >
            <SidebarHeader className="h-16 justify-center border-b border-slate-200 px-3 py-2 group-data-[collapsible=icon]:px-2">
                <AppLogo />
            </SidebarHeader>

            <SidebarContent className="scroll-slim px-2 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-2.5 group-data-[collapsible=icon]:p-2">
                <NavUser />
            </SidebarFooter>
            <SidebarRail className="hover:after:bg-sky-300" />
        </Sidebar>
    );
}
