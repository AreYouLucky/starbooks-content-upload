import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { useHandleChange } from '@/hooks/use-handle-change';
import BatchForm from './partials/batch-form';
import { CalendarDays, FolderSync, PencilLine, Plus, Search, } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import type { BatchModel } from '@/types/model';
import { useFetchBatches } from './partials/batches-hooks';
import { displayDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { getStats, getStatusTone, getStatusColor } from './partials/defaults';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Batches',
        href: '/view-batches',
    },
];

export default function ViewBatches() {
    const [page, setPage] = useState(1);

    const onFilterChange = () => {
        setPage(1);
    };

    const [batchDialog, setBatchDialog] = useState(false);
    const { item, setItem } = useHandleChange({
        search: '',
    });
    const [batch, setBatch] = useState<BatchModel>({
        id: 0,
        batch_name: '',
        batch_description: '',
        target_published_date: new Date().toISOString().split('T')[0],
        content_source: '',
    });
    const debouncedSearch = useDebounce(item.search, 1000);
    const queryFilters = {
        ...item,
        search: debouncedSearch,
    };
    const { data, isFetching, refetch } = useFetchBatches(page, queryFilters);
    const batches = data?.data ?? [];

    const stats = getStats(batches);


    const showUpdateDialog = (batch: BatchModel) => {
        setBatchDialog(true);
        setBatch(batch);
    };

    return (
        <div className="space-y-4 p-1">
            <section className="relative overflow-hidden rounded-lg border border-sky-200 bg-sky-500 p-5 text-white shadow-sm md:p-7">
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold">
                                Batch Management
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-sky-50 sm:text-base">
                                Track upload groups, review targets, and
                                publication schedules in one place.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-lg border-white/70 bg-white px-4 text-slate-700 shadow-none "
                            onClick={() => refetch()}
                        >
                            <FolderSync className="size-4" />
                            Refresh
                        </Button>
                        <Button
                            className="flex h-10 gap-2 rounded-lg border border-white bg-sky-600 px-5 text-white shadow-none "
                            onClick={() => setBatchDialog(true)}
                        >
                            <Plus className="size-4" />
                            New batch
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <Card
                            key={stat.label}
                            className={`gap-0 rounded-lg py-0 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md ${stat.cardTone}`}
                        >
                            <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-600">
                                        {stat.label}
                                    </p>
                                    <p className="text-3xl font-semibold text-slate-900">
                                        {stat.value}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg p-3 ring-1 ${stat.tone}`}
                                >
                                    <Icon className="size-5" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <Card className="gap-0 overflow-hidden rounded-lg border-sky-300 bg-white py-0 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-sky-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative space-y-1">
                        <Search
                            className="absolute top-3 left-3 text-sky-500"
                            size={16}
                        />
                        <Input
                            id="search"
                            name="search"
                            type="text"
                            placeholder="Search any keyword..."
                            onChange={(e) => {
                                setItem((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }));
                                onFilterChange();
                            }}
                            className="h-10 min-w-62.5 border-sky-200 bg-white ps-9 shadow-none focus-visible:border-sky-400 focus-visible:ring-sky-100"
                        />
                    </div>
                </div>

                <CardContent className="overflow-x-auto p-4 sm:p-5 ">
                    <PaginatedSearchTable<BatchModel>
                        items={batches}
                        headers={[
                            { name: 'Batch', position: 'left' },
                            { name: 'Source', position: 'left' },
                            { name: 'Target Date', position: 'left' },
                            { name: 'Date Accomplished', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        searchBy={(item) =>
                            `${item.batch_name} ${item.content_source} ${item.batch_description}`
                        }
                        renderRow={(batch) => {
                            return (
                                <tr
                                    key={batch.id}
                                    className="border-b border-slate-100 bg-white transition hover:bg-sky-50/50"
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
                                        <div className="inline-flex rounded-full  px-3 py-1 text-xs font-semibold text-slate-600 uppercase">
                                            {batch.content_source}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="space-y-1 text-xs text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="size-4 text-cyan-500" />
                                                Shortlist:{' '}
                                                {displayDate(
                                                    batch.target_shortlist_date,
                                                )}
                                            </div>
                                            {!batch.is_dost && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="size-4 text-cyan-500" />
                                                    IR:{' '}
                                                    {displayDate(
                                                        batch.target_initial_review_date,
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="size-4 text-cyan-500" />
                                                QA:{' '}
                                                {displayDate(
                                                    batch.target_quality_approval_date,
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="size-4 text-cyan-500" />
                                                Publish:{' '}
                                                {displayDate(
                                                    batch.target_published_date,
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center align-middle text-sm text-slate-700">
                                        <div className="space-y-1 text-xs text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays
                                                    className={`size-4 ${getStatusColor(
                                                        batch.target_shortlist_date,
                                                        batch.shortlisted_date,
                                                    )}`}
                                                />
                                                Shortlisted:{' '}
                                                {displayDate(
                                                    batch.shortlisted_date,
                                                )}
                                            </div>
                                            {!batch.is_dost && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays
                                                        className={`size-4 ${getStatusColor(
                                                            batch.target_initial_review_date,
                                                            batch.initial_reviewed_date,
                                                        )}`}
                                                    />
                                                    IR:{' '}
                                                    {displayDate(
                                                        batch.initial_reviewed_date,
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <CalendarDays
                                                    className={`size-4 ${getStatusColor(
                                                        batch.target_quality_approval_date,
                                                        batch.quality_approval_date,
                                                    )}`}
                                                />
                                                QA:{' '}
                                                {displayDate(
                                                    batch.quality_approval_date,
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CalendarDays
                                                    className={`size-4 ${getStatusColor(
                                                        batch.target_published_date,
                                                        batch.published_date,
                                                    )}`}
                                                />
                                                Published:{' '}
                                                {displayDate(
                                                    batch.published_date,
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span
                                            className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${getStatusTone(batch.status)}`}
                                        >
                                            {batch.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-9 rounded-lg border-sky-200 bg-sky-500 px-3 text-white shadow-none hover:bg-sky-50 hover:text-sky-800"
                                                onClick={() =>
                                                    showUpdateDialog(batch)
                                                }
                                            >
                                                <PencilLine className="size-4" />
                                                Edit
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                        itemsPerPage={5}
                        searchPlaceholder="Search batches"
                        onRefresh={() => refetch()}
                        isLoading={isFetching}
                        emptyText="No batches found yet."
                        total={batches.length}
                    />
                </CardContent>
            </Card>
            <BatchForm
                show={batchDialog}
                onClose={() => setBatchDialog(false)}
                data={batch}
            />
        </div>
    );
}

ViewBatches.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
