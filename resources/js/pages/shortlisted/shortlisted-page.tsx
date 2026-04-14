import { ReactNode, useState } from 'react';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import {
    CalendarDays,
    FolderSync,
    Plus,
    PencilLine,
    Search,
    Eye,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PiListPlusLight } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { BatchModel } from '@/types/model';
import type { BreadcrumbItem } from '@/types';
import {
    useFetchShortlisted,
    useToggleBatchShortlist,
} from './partials/shortlisted-hooks';
import { useHandleChange } from '@/hooks/use-handle-change';
import { useDebounce } from '@/hooks/use-debounce';
import { displayDate } from '@/lib/utils';
import { toast } from 'react-toastify';
import { Link } from '@inertiajs/react';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { getStatusTone } from '../batches/partials/defaults';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'For Shortlisting',
        href: '/shortlisted-page',
    },
];

export default function ShortlistedPage() {
    const [page, setPage] = useState(1);
    const { item, setItem } = useHandleChange({
        search: '',
        batch_id: 0,
    });

    const onFilterChange = () => {
        setPage(1);
    };

    const debouncedSearch = useDebounce(item.search, 1000);
    const [open, setOpen] = useState(false);
    const [id, setId] = useState(0);
    const queryFilters = {
        ...item,
        search: debouncedSearch,
    };

    const { data, isFetching, refetch } = useFetchShortlisted(
        page,
        queryFilters,
    );
    const batches = data?.data ?? [];

    const toggleBatchShortlist = useToggleBatchShortlist();
    const toggleBatchShortlistFn = () => {
        toggleBatchShortlist.mutate(id, {
            onSuccess: () => {
                refetch();
                toast.success('Batch Shortlisted Successfully');
                setOpen(false);
            },
        });
    };

    return (
        <div className="space-y-4 p-1">
            <section className="relative overflow-hidden rounded-lg border border-sky-200 bg-sky-500 p-5 text-white shadow-sm md:p-7">
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold">
                                For Shortlisting
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-sky-50 sm:text-base">
                                Track uploaded content, open batch records, and
                                move approved batches into the next review
                                stage.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-lg border-white/70 bg-white px-4 text-slate-700 shadow-none hover:bg-sky-50"
                            onClick={() => refetch()}
                        >
                            <FolderSync className="size-4" />
                            Refresh
                        </Button>
                        <Link
                            href={'/bulk-upload/create'}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white bg-sky-500  px-5 font-semibold text-white shadow-none hover:bg-white hover:text-slate-900"
                        >
                            <PiListPlusLight className="size-4" />
                            Bulk Upload
                        </Link>
                        <Link
                            href={'/single-upload/create'}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white bg-sky-600 px-5 font-semibold text-white shadow-none hover:bg-white hover:text-slate-900"
                        >
                            <Plus className="size-4" />
                            Single Upload
                        </Link>
                    </div>
                </div>
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
                            className="h-10 min-w-62.5 border-sky-200 bg-white ps-9 shadow-none focus-visible:border-sky-400 focus-visible:ring-sky-100"
                            onChange={(e) => {
                                setItem((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }));
                                onFilterChange();
                            }}
                        />
                    </div>
                </div>

                <CardContent className="overflow-x-auto p-4 sm:p-5">
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
                                        <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-slate-600 uppercase">
                                            {batch.content_source}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CalendarDays className="size-4 text-cyan-500" />
                                            {displayDate(
                                                batch.target_shortlist_date,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CalendarDays className="size-4 text-cyan-500" />
                                            {displayDate(
                                                batch.shortlisted_date,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span
                                            className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${getStatusTone(batch.status)}`}
                                        >
                                            {batch.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-2 align-middle">
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            {(batch.status ===
                                                'for shortlisting' ||
                                                batch.status ===
                                                    'for initial review') && (
                                                <Button
                                                    variant="outline"
                                                    className={`h-9 rounded-lg  w-full py-5 px-3 shadow-none ${batch.status === 'for shortlisting' ? 'border-sky-200 bg-yellow-500 text-white hover:bg-sky-50 hover:text-sky-800' : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                    onClick={() => {
                                                        setOpen(true);
                                                        setId(batch.id);
                                                    }}
                                                >
                                                    <PencilLine className="size-4" />
                                                    {batch.status ===
                                                    'for shortlisting'
                                                        ? 'Mark as Shortlisted'
                                                        : 'Shortlisted'}
                                                </Button>
                                            )}
                                            <Link
                                                href={`/shortlist/${batch.id}`}
                                                className="flex h-9 items-center w-full justify-center gap-2 rounded-lg border py-5 border-sky-200 bg-sky-500 px-3 font-semibold text-white hover:bg-sky-50 hover:text-sky-800"
                                            >
                                                <Eye className="size-4" />
                                                View Contents
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                        itemsPerPage={5}
                        searchPlaceholder="Search batches"
                        onRefresh={() => refetch()}
                        isLoading={isFetching}
                        emptyText="No for shortlisting found yet."
                        total={batches.length}
                    />
                </CardContent>
            </Card>
            <ConfirmationDialog
                show={open}
                onClose={() => setOpen(false)}
                type={2}
                onConfirm={toggleBatchShortlistFn}
                message="Are you sure you want to proceed?"
            />
        </div>
    );
}
ShortlistedPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
