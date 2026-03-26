import { ReactNode,useState } from 'react'
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { CalendarDays, FolderSync, Plus, PencilLine, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PiListPlusLight } from "react-icons/pi";
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { BatchModel } from '@/types/model';
import type { BreadcrumbItem } from '@/types';
import { useFetchShortlisted, useToggleBatchShortlist } from './partials/shortlisted-hooks';
import { useHandleChange } from '@/hooks/use-handle-change';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-toastify';
import { Link } from '@inertiajs/react';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
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
    const { item, handleChange } = useHandleChange({
        search: "", batch_id: 0
    })

    const debouncedTitle = useDebounce(item.search, 1000);
    const [open, setOpen] = useState(false);
    const [id, setId] = useState(0);
    const queryFilters = {
        ...item,
        search: debouncedTitle,
    };

    const { data, isFetching, refetch } = useFetchShortlisted(1, queryFilters)


    const displayDate = (date?: string) => {
        return date ? formatDate(date) : "NA";
    };

    const toggleBatchShortlist = useToggleBatchShortlist()
    const toggleBatchShortlistFn = () => {
        toggleBatchShortlist.mutate(id, {
            onSuccess: () => {
                refetch()
                toast.success("Batch Shortlisted Successfully");
                setOpen(false);
            }
        })
    }

    return (
        <div className="space-y-3">
            <section className="relative overflow-hidden rounded-xl p-4 border border-sky-100 bg-sky-500 md:p-8 text-white">
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight ">
                                For Shortlisting
                            </h1>
                            <p className="max-w-xl text-sm leading-6  sm:text-base">
                                Track upload content for shortlisting, generate for shortlisting reports and manage batch status.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-lg border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-100"
                            onClick={() => refetch()}
                        >
                            <FolderSync className="size-4" />
                            Refresh
                        </Button>
                        <Link href={'/bulk-upload/create'} className="h-11 rounded-lg bg-sky-500 border border-white px-5 text-white hover:bg-sky-600 flex gap-2 items-center justify-center  hover:text-white font-semibold hover:scale-105" >
                            <PiListPlusLight className="size-4" />
                            Bulk Upload
                        </Link>
                        <Link href={'/single-upload/create'} className="h-11 rounded-lg bg-sky-500 px-5 text-white hover:bg-sky-600 flex gap-2 items-center justify-center font-semibold hover:scale-105 border border-white" >
                            <Plus className="size-4" />
                            Single Upload
                        </Link>
                    </div>
                </div>
            </section>
            <Card className="gap-0 rounded-xl border-sky-100 py-0 ">
                <div className="flex flex-col gap-3 border-b border-sky-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 relative">
                        <Search className="absolute left-2.5 top-3 text-[#00aeef]" size={16} />
                        <Input
                            id="title"
                            name="title"
                            type="text"
                            placeholder="Search any keyword..."
                            className="min-w-62.5 h-10 border-[#d1f3ff] shadow-none ps-8"
                            onChange={handleChange}
                        />
                    </div>

                </div>

                <CardContent className="p-4 sm:px-6">
                    <PaginatedSearchTable<BatchModel>
                        items={data?.data ?? []}
                        headers={[
                            { name: 'Batch', position: 'left' },
                            { name: 'Content Source', position: 'left' },
                            { name: 'Target Date ', position: 'left' },
                            { name: 'Date Accomplished ', position: 'left' },
                            { name: 'STATUS', position: 'left' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(batch) => {
                            return (
                                <tr key={batch.id} className="border-b border-sky-100 bg-white transition hover:bg-slate-50/80">
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-slate-900">{batch.batch_name}</div>
                                            <p className="max-w-md text-sm leading-6 text-slate-500 text-justify">
                                                {batch.batch_description}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="inline-flex rounded-full  px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                                            {batch.content_source}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className=" rounded-full  px-3 py-1 text-xs font-semibold  text-slate-500 flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {displayDate(batch.target_shortlist_date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className=" rounded-full  px-3 py-1 text-xs font-semibold  text-slate-500 flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {displayDate(batch.shortlisted_date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span className={`inline-flex rounded-full  bg-sky-50 uppercase text-sky-500 px-3 py-1 text-xs font-semibold`}>
                                            {batch.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex items-start justify-center flex-col gap-2">
                                            {(batch.status === 'for shortlisting' || batch.status === 'for initial review') &&
                                                <Button variant="outline" className={`h-9 rounded-lg border-sky-100 px-3 ${batch.status === 'for shortlisting' ? 'bg-slate-100 text-slate-600' : 'bg-gray-200'}`} onClick={() => {setOpen(true); setId(batch.id)}}>
                                                    <PencilLine className="size-4" />
                                                    {batch.status === 'for shortlisting' ? 'Mark as Shortlisted' : 'Shortlisted'}
                                                </Button>
                                            }
                                            <Link href={`/shortlist/${batch.id}`} className=" flex justify-center items-center font-semibold gap-2 h-9 rounded-lg border-sky-100 px-3 bg-sky-400 text-white hover:text-white hover:scale-105" >
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
                        total={data?.data.length ?? 0}
                    />
                </CardContent>
            </Card>
            <ConfirmationDialog show={open} onClose={() => setOpen(false)} type={2} onConfirm={toggleBatchShortlistFn} message="Are you sure you want to proceed?" />
        </div>
    )
}
ShortlistedPage.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;