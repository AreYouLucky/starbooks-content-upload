import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    ClipboardCheck,
    Layers3,
    ListChecks,
    SendToBack,
    Settings2,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type IsCurrentUrlFn, useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem, SharedData } from '@/types';

type NavigationSection = {
    label: string;
    icon: typeof Settings2;
    items: NavItem[];
};

const workflowItems: NavItem[] = [
    {
        title: 'Batches',
        href: '/view-batches',
        icon: Layers3,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
    {
        title: 'For Shortlisting',
        href: '/view-shortlisted',
        icon: ListChecks,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
    {
        title: 'For Committee Review',
        href: '/committee-review-page',
        icon: ClipboardCheck,
        allowedRoles: ['admin', 'super_admin', 'committee'],
    },
    {
        title: 'For Quality Assurance',
        href: '/quality-assurance-page',
        icon: ShieldCheck,
        allowedRoles: ['admin', 'super_admin',  'quality'],
    },
    {
        title: 'For Publishing',
        href: '/publishing-page',
        icon: SendToBack,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
];

const configurationItems: NavItem[] = [
    {
        title: 'Manage Users',
        href: '/manage-users',
        icon: UsersRound,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
];

const menuButtonClassName =
    'h-10 rounded-lg px-3 text-[13px] font-medium tracking-[-0.01em] text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800 data-[active=true]:bg-sky-600 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-sm [&>svg]:size-[17px] [&>svg]:text-sky-600 data-[active=true]:[&>svg]:text-white';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user?.role;

    const sections: NavigationSection[] = [
        {
            label: 'Content Management',
            icon: BookOpenCheck,
            items: filterNavigationItems(workflowItems, userRole),
        },
        {
            label: 'Configurations',
            icon: Settings2,
            items: filterNavigationItems(configurationItems, userRole),
        },
    ].filter((section) => section.items.length > 0);

    return (
        <SidebarGroup className="gap-5 p-0 group-data-[collapsible=icon]:gap-1.5">
            <NavigationMenu
                items={filterNavigationItems(items, userRole)}
                isCurrentUrl={isCurrentUrl}
            />

            {sections.map((section) => (
                <div
                    className="space-y-1 group-data-[collapsible=icon]:contents"
                    key={section.label}
                >
                    <SidebarGroupLabel className="h-7 gap-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
                        <section.icon className="size-3.5" />
                        <span>{section.label}</span>
                    </SidebarGroupLabel>
                    <NavigationMenu
                        items={section.items}
                        isCurrentUrl={isCurrentUrl}
                    />
                </div>
            ))}
        </SidebarGroup>
    );
}

function filterNavigationItems(items: NavItem[], userRole?: string): NavItem[] {
    return items.filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
            return true;
        }

        return Boolean(userRole && item.allowedRoles.includes(userRole));
    });
}

function NavigationMenu({
    items,
    isCurrentUrl,
}: {
    items: NavItem[];
    isCurrentUrl: IsCurrentUrlFn;
}) {
    return (
        <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(item.href)}
                        tooltip={{ children: item.title }}
                        className={menuButtonClassName}
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
