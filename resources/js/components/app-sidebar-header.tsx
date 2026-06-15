import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-6 transition-[width,height] ease-linear md:px-5">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
