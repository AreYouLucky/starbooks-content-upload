import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FolderSync,
    PackageCheck,
    Search,
    type LucideIcon,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useHandleChange } from '@/hooks/use-handle-change';
import { displayDate, getPageFromUrl } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import {
    useFetchPublishingBatches,
    type PublishingBatch,
} from './partials/publishing-hooks';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'For Publishing', href: '/publishing-page' },
];

export default function PublishingPage(): JSX.Element {
    const [page, setPage] = useState(1);
    const { item, setItem } = useHandleChange({ search: '' });
    const debouncedSearch = useDebounce(item.search, 1000);
    const { data, isFetching, refetch } = useFetchPublishingBatches(page, {
        search: debouncedSearch,
    });
    const analytics = data?.analytics ?? {
        for_publishing: 0,
        published: 0,
        total_batches: 0,
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Publishing Batches
                        </h1>
                        <p className="text-sm leading-6 text-sky-50 sm:text-base">
                            Track all active batches that are ready for
                            publishing after quality assurance approval.
                        </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
                        <SummaryCard
                            icon={PackageCheck}
                            label="For Publishing"
                            value={analytics.for_publishing}
                            detail="ready batches"
                        />
                        <SummaryCard
                            icon={CheckCircle2}
                            label="Published"
                            value={analytics.published}
                            detail="completed batches"
                        />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                        <div className="relative min-w-0 sm:w-80">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-500" />
                            <Input
                                name="search"
                                placeholder="Search batch name, source, or description..."
                                className="h-10 border-sky-200 bg-white ps-9"
                                onChange={(event) => {
                                    setItem((current) => ({
                                        ...current,
                                        search: event.target.value,
                                    }));
                                    setPage(1);
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={() => refetch()}
                            className="h-10 bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <FolderSync className="size-4" /> Refresh
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-600">
                            Total Batches: {analytics.total_batches}
                        </p>
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <PaginatedSearchTable<PublishingBatch>
                        items={data?.data ?? []}
                        headers={[
                            { name: 'Batch', position: 'left' },
                            { name: 'Source', position: 'left' },
                            { name: 'Publishing Target', position: 'left' },
                            { name: 'QA Approved', position: 'left' },
                            { name: 'Records', position: 'center' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(batch) => (
                            <tr
                                key={batch.id}
                                className="border-b border-slate-100 bg-white"
                            >
                                <td className="px-6 py-4 align-middle">
                                    <p className="font-semibold text-slate-900">
                                        {batch.batch_name}
                                    </p>
                                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                        {batch.batch_description}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-middle text-sm font-semibold text-slate-600">
                                    {batch.content_source}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <CalendarDays className="size-4 text-cyan-500" />
                                        {displayDate(batch.target_published_date)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock3 className="size-4 text-emerald-500" />
                                        {displayDate(
                                            batch.quality_approval_date ?? '',
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle text-center">
                                    <span className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                                        <Archive className="size-3.5" />
                                        {batch.records_count ?? 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle text-center">
                                    <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                        <PackageCheck className="size-3.5" />
                                        Ready
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle text-center">
                                    <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                        <PackageCheck className="size-3.5" />
                                        Ready
                                    </span>
                                </td>
                            </tr>
                        )}
                        searchPlaceholder="Search batches"
                        onRefresh={() => refetch()}
                        isLoading={isFetching}
                        emptyText="No batches require publishing."
                        currentPage={data?.current_page}
                        totalPages={data?.last_page}
                        nextPageUrl={data?.next_page_url}
                        prevPageUrl={data?.prev_page_url}
                        total={data?.total ?? 0}
                        itemsPerPage={data?.per_page ?? 5}
                        onPageChange={(url) => {
                            const nextPage = getPageFromUrl(url);
                            if (nextPage !== null) setPage(nextPage);
                        }}
                    />
                </div>
            </section>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    detail: string;
}): JSX.Element {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                <Icon className="size-3.5" />
                {label}
            </p>
            <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold md:text-3xl">{value}</span>
                <span className="pb-1 text-xs text-sky-100">{detail}</span>
            </div>
        </div>
    );
}

PublishingPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
