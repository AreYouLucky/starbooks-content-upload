import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SharedData } from '@/types';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    return (
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group h-12 rounded-lg border border-slate-200 bg-slate-50/70 px-2 text-slate-800 shadow-none transition-colors group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900 data-[state=open]:border-sky-200 data-[state=open]:bg-sky-50 data-[state=open]:text-slate-900"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={auth.user} showEmail />
                            <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
