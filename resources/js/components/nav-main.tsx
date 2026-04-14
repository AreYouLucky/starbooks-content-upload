import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import { RiBookShelfLine,RiFileList3Line  } from "react-icons/ri";
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage<SharedData>().props;
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            <div className='py-4'>
                <SidebarGroupLabel >Content Management</SidebarGroupLabel>
                <SidebarMenu>
                    {
                        (auth.user?.role == 'super_admin' || auth.user?.role == 'stii_admin') &&
                        <>
                            <SidebarMenuItem >
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/view-batches')}
                                    tooltip={{ children: 'View Batches' }}
                                >
                                    <Link href={'/view-batches'} prefetch>
                                        <RiBookShelfLine />
                                        <span>Batches</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem >
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl('/view-shortlisted')}
                                    tooltip={{ children: 'For ShortListing' }}
                                >
                                    <Link href={'/view-shortlisted'} prefetch>
                                        <RiFileList3Line />
                                        <span>For Shortlisting</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>


                        </>

                    }
                </SidebarMenu>
            </div>
        </SidebarGroup>
    );
}
