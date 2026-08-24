import { Link, usePage } from '@inertiajs/react';
import { Fragment, type JSX } from 'react';
import {
    BookOpenCheck,
    ClipboardCheck,
    BookUser,
    ListChecks,
    SendToBack,
    Settings2,
    ArchiveRestore,
    ShieldCheck,
    ShieldX,
    UsersRound,
    CalendarCog,
    ChevronRight,
    FileChartColumnIncreasing,
} from 'lucide-react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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
        icon: BookUser,
        allowedRoles: ['admin', 'super_admin', 'stii_admin', 'head_committee'],
    },
    {
        title: 'For Shortlisting',
        href: '/view-shortlisted',
        icon: ListChecks,
        allowedRoles: ['super_admin', 'head_committee'],
    },
    {
        title: 'For Assignment',
        href: '/view-assignment-designation',
        icon: CalendarCog,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
    {
        title: 'For Initial Review',
        href: '/initial-review-page',
        icon: ClipboardCheck,
        allowedRoles: ['admin', 'super_admin', 'committee', 'head_committee'],
    },
    {
        title: 'For Quality Assurance',
        href: '/quality-assurance-page',
        icon: ShieldCheck,
        allowedRoles: ['admin', 'super_admin', 'quality'],
    },
    {
        title: 'QA Rejected',
        href: '/quality-assurance-rejected',
        icon: ShieldX,
        allowedRoles: ['stii_admin', 'super_admin', 'admin'],
    },
    {
        title: 'For Publishing',
        href: '/publishing-page',
        icon: SendToBack,
        allowedRoles: ['admin', 'super_admin', 'stii_admin'],
    },
    {
        title: 'Existing Records',
        href: '/existing-records',
        icon: ArchiveRestore,
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

const reportItems: NavItem[] = [
    {
        title: 'Shortlisted',
        href: '/reports/shortlisted',
        icon: ListChecks,
        allowedRoles: ['stii_admin', 'admin', 'super_admin'],
    },
    {
        title: 'Initial Review',
        href: '/reports/initial-review',
        icon: ClipboardCheck,
        allowedRoles: ['committee', 'admin', 'super_admin'],
    },
    {
        title: 'Quality Assurance',
        href: '/reports/quality-assurance',
        icon: ShieldCheck,
        allowedRoles: ['quality', 'quality_admin', 'admin', 'super_admin'],
    },
    {
        title: 'Publishing',
        href: '/reports/publishing',
        icon: SendToBack,
        allowedRoles: ['stii_admin', 'admin', 'super_admin'],
    },
];

const menuButtonClassName =
    'h-10 rounded-lg px-3 text-[13px] font-medium tracking-[-0.01em] text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800 data-[active=true]:bg-sky-600 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-sm [&>svg]:size-[17px] [&>svg]:text-sky-600 data-[active=true]:[&>svg]:text-white';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user?.role;
    const visibleReportItems = filterNavigationItems(reportItems, userRole);

    const sections: NavigationSection[] = [
        {
            label: 'Approval Section',
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

            {sections.map((section, index) => (
                <Fragment key={section.label}>
                    <div className="space-y-1 group-data-[collapsible=icon]:contents">
                        <SidebarGroupLabel className="h-7 gap-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
                            <section.icon className="size-3.5" />
                            <span>{section.label}</span>
                        </SidebarGroupLabel>
                        <NavigationMenu
                            items={section.items}
                            isCurrentUrl={isCurrentUrl}
                        />
                    </div>
                    {index === 0 && visibleReportItems.length > 0 ? (
                        <ReportNavigationMenu
                            items={visibleReportItems}
                            isCurrentUrl={isCurrentUrl}
                        />
                    ) : null}
                </Fragment>
            ))}
        </SidebarGroup>
    );
}

function ReportNavigationMenu({
    items,
    isCurrentUrl,
}: {
    items: NavItem[];
    isCurrentUrl: IsCurrentUrlFn;
}): JSX.Element {
    const isReportActive = items.some((item) => isCurrentUrl(item.href));

    return (
        <div className="space-y-1 group-data-[collapsible=icon]:contents">
            <SidebarGroupLabel className="h-7 gap-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
                <FileChartColumnIncreasing className="size-3.5" />
                Reporting
            </SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible
                    defaultOpen={isReportActive}
                    className="group/report"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                isActive={isReportActive}
                                tooltip={{ children: 'Generate Report' }}
                                className={`${menuButtonClassName} group-data-[state=open]/report:bg-sky-50 group-data-[state=open]/report:text-sky-800 data-[active=true]:group-data-[state=open]/report:bg-sky-600 data-[active=true]:group-data-[state=open]/report:text-white`}
                            >
                                <FileChartColumnIncreasing />
                                <span>Generate Report</span>
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/report:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1">
                            <SidebarMenuSub className="mx-3 gap-1 border-sky-200 px-2 py-1">
                                {items.map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(item.href)}
                                            className="h-9 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-800 data-[active=true]:bg-sky-100 data-[active=true]:font-semibold data-[active=true]:text-sky-800 [&>svg]:size-3.5 [&>svg]:text-sky-500"
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </div>
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
