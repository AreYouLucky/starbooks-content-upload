import { ReactNode, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { useFetchCommitteeReview } from './partials/committee-review-hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { useHandleChange } from '@/hooks/use-handle-change';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Eye,
    FolderSync,
    Search,
    ShieldX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PiListBulletsFill } from 'react-icons/pi';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { BatchModel } from '@/types/model';
import { displayDate, getPageFromUrl } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import GenerateReport from './partials/generate-report';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'For Committee Review',
        href: '/view-committee-review-batches',
    },
];

const reviewSummaryItems = [
    {
        key: 'pending',
        label: 'Pending',
        icon: Clock3,
        tone: 'border-sky-200 bg-sky-50 text-sky-700',
        iconTone: 'text-sky-500',
    },
    {
        key: 'approved',
        label: 'Approved',
        icon: CheckCircle2,
        tone: 'border-blue-200 bg-blue-50 text-blue-700',
        iconTone: 'text-blue-500',
    },
    {
        key: 'rejected',
        label: 'Rejected',
        icon: ShieldX,
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
        iconTone: 'text-rose-500',
    },
] as const;

export default function CommitteeReviewPage() {
    const [page, setPage] = useState(1);
    const [generateReportDialog,setGenerateReportDialog] = useState(false);
    const { item, setItem } = useHandleChange({ search: '', batch_id: 0 });

    const onFilterChange = () => {
        setPage(1);
    };

    const debouncedSearch = useDebounce(item.search, 1000);
    const queryFilters = {
        ...item,
        search: debouncedSearch,
    };

    const { data, isFetching, refetch } = useFetchCommitteeReview(
        page,
        queryFilters,
    );
    const batches = data?.data ?? [];
    const analytics = data?.analytics ?? {
        for_committee_review: 0,
        reviewed: 0,
    };

    return (
        <div className="space-y-5 p-1">
            <section className="relative overflow-hidden rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-white/10 blur-3xl lg:block" />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                Committee Review Batches
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-sky-50 sm:text-base">
                                Monitor batches queued for committee review,
                                inspect record decisions, and keep the review
                                pipeline visible at a glance.
                            </p>
                        </div>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
                        <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm">
                            <p className="text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                                For Committee Review
                            </p>
                            <div className="mt-2 flex items-end gap-2">
                                <span className="text-2xl font-bold md:text-3xl">
                                    {analytics.for_committee_review}
                                </span>
                                <span className="pb-1 text-xs text-sky-100">
                                    active batches
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm">
                            <p className="text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                                Reviewed
                            </p>
                            <div className="mt-2 flex items-end gap-2">
                                <span className="text-2xl font-bold md:text-3xl">
                                    {analytics.reviewed}
                                </span>
                                <span className="pb-1 text-xs text-sky-100">
                                    completed batches
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1 flex flex-row gap-2">
                        <div className="relative min-w-0 sm:w-72">
                            <Search
                                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-500"
                                size={16}
                            />
                            <Input
                                id="search"
                                name="search"
                                type="text"
                                placeholder="Search batch name or description..."
                                className="h-10 border-sky-200 bg-white ps-9 shadow-none focus-visible:border-sky-400 focus-visible:ring-sky-100"
                                onChange={(e) => {
                                    setItem((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }));
                                    onFilterChange();
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-lg border-sky-200 bg-sky-600 px-4 text-sky-50 shadow-none hover:bg-sky-50 hover:text-sky-800"
                            onClick={() => refetch()}
                        >
                            <FolderSync className="size-4" />
                            Refresh
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setGenerateReportDialog(true)}
                            className="h-10 rounded-lg border-sky-500 bg-sky-600 px-4 text-slate-50 shadow-none hover:bg-sky-700"
                        >
                            <PiListBulletsFill className="size-4" />
                            Generate Report
                        </Button>
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <PaginatedSearchTable<BatchModel>
                        items={batches}
                        headers={[
                            { name: 'Batch', position: 'left' },
                            { name: 'Source', position: 'left' },
                            { name: 'Target Date', position: 'left' },
                            { name: 'Date Accomplished', position: 'left' },
                            { name: 'Review Summary', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(batch) => {
                            return (
                                <tr
                                    key={batch.id}
                                    className="border-b border-slate-100 bg-white transition"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-slate-900">
                                                {batch.batch_name}
                                            </div>
                                            <p className="max-w-md text-sm leading-6 text-slate-500">
                                                {batch.batch_description}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 uppercase">
                                            {batch.content_source}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <CalendarDays className="size-4 text-cyan-500" />
                                            {displayDate(
                                                batch.target_initial_review_date,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <CalendarDays className="size-4 text-cyan-500" />
                                            {displayDate(
                                                batch.initial_reviewed_date,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <div className="grid gap-1.5 sm:min-w-44">
                                            {reviewSummaryItems.map(
                                                ({
                                                    key,
                                                    label,
                                                    icon: Icon,
                                                    tone,
                                                    iconTone,
                                                }) => {
                                                    const value =
                                                        key === 'pending'
                                                            ? batch.pending ?? 0
                                                            : key === 'approved'
                                                                ? batch.approved ?? 0
                                                                : batch.rejected ?? 0;

                                                    return (
                                                        <div
                                                            key={key}
                                                            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${tone}`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Icon
                                                                    className={`size-3.5 ${iconTone}`}
                                                                />
                                                                {label}
                                                            </span>
                                                            <span className="text-xs font-bold">
                                                                {value}
                                                            </span>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 align-middle">
                                        <div className="flex items-center justify-center">
                                            <Link
                                                href={`/view-committee-review-batch/${batch.batch_name}`}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sky-400 bg-sky-600 px-4 font-semibold text-sky-50 hover:bg-sky-50 hover:text-sky-800"
                                            >
                                                <Eye className="size-4" />
                                                View Requests
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                        searchPlaceholder="Search batches"
                        onRefresh={() => refetch()}
                        isLoading={isFetching}
                        emptyText="No committee review batches found yet."
                        currentPage={data?.current_page}
                        totalPages={data?.last_page}
                        nextPageUrl={data?.next_page_url}
                        prevPageUrl={data?.prev_page_url}
                        total={data?.total ?? 0}
                        itemsPerPage={data?.per_page ?? 5}
                        onPageChange={(url) => {
                            const nextPage = getPageFromUrl(url);

                            if (nextPage !== null) {
                                setPage(nextPage);
                            }
                        }}
                    />
                </div>
            </section>
            <GenerateReport show={generateReportDialog} onClose={() => setGenerateReportDialog(false)} />
        </div>
    );
}
CommitteeReviewPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
