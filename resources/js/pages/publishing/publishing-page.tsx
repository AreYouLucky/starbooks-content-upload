import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import {
    CalendarCheck2,
    CheckCircle2,
    Clock3,
    FolderSync,
    PackageCheck,
    Search,
    Send,
    type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { displayDate, getPageFromUrl } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import {
    getPublishingErrorMessage,
    useFetchPublishingRequests,
    usePublishRequest,
    type PublishingRequest,
} from './partials/publishing-hooks';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'For Publishing', href: '/publishing-page' },
];

export default function PublishingPage(): JSX.Element {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [quarter, setQuarter] = useState('all');
    const [year, setYear] = useState('all');
    const [requestId, setRequestId] = useState<number | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 500);
    const { data, isFetching, refetch } = useFetchPublishingRequests(page, {
        search: debouncedSearch,
        quarter,
        year,
    });
    const publishRequest = usePublishRequest();
    const analytics = data?.analytics ?? {
        for_publishing: 0,
        published: 0,
        total_contents: 0,
        published_this_quarter: 0,
        published_this_year: 0,
        current_quarter: '',
        current_year: '',
    };

    const handlePublish = (): void => {
        if (requestId === null) return;

        publishRequest.mutate(requestId, {
            onSuccess: (response) => {
                setIsConfirmationOpen(false);
                setRequestId(null);
                toast.success(response.message);
            },
            onError: (error) => {
                setIsConfirmationOpen(false);
                toast.error(getPublishingErrorMessage(error));
            },
        });
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Publishing Contents
                        </h1>
                        <p className="text-sm leading-6 text-sky-50 sm:text-base">
                            Track and publish individual content requests after
                            quality assurance approval.
                        </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-4">
                        <SummaryCard
                            icon={PackageCheck}
                            label="For Publishing"
                            value={analytics.for_publishing}
                            detail="filtered contents"
                        />
                        <SummaryCard
                            icon={CheckCircle2}
                            label="Published"
                            value={analytics.published}
                            detail="filtered contents"
                        />
                        <SummaryCard
                            icon={CalendarCheck2}
                            label={`This ${analytics.current_quarter || 'Quarter'}`}
                            value={analytics.published_this_quarter}
                            detail="published contents"
                        />
                        <SummaryCard
                            icon={CalendarCheck2}
                            label={analytics.current_year || 'This Year'}
                            value={analytics.published_this_year}
                            detail="published contents"
                        />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <div className="relative min-w-0 md:w-80">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-500" />
                            <Input
                                value={search}
                                placeholder="Search title, author, holdings ID, or batch"
                                className="h-10 border-sky-200 bg-white ps-9"
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <Select
                            value={quarter}
                            onValueChange={(value) => {
                                setQuarter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                aria-label="Filter by quarter"
                                className="h-10 w-full bg-white text-slate-600 md:w-44"
                            >
                                <SelectValue placeholder="All quarters" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All quarters
                                </SelectItem>
                                {(data?.quarters ?? []).map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={year}
                            onValueChange={(value) => {
                                setYear(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                aria-label="Filter by year"
                                className="h-10 w-full bg-white text-slate-600 md:w-36"
                            >
                                <SelectValue placeholder="All years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {(data?.years ?? []).map((item) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => refetch()}
                            className="h-10 border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                            <FolderSync className="size-4" /> Refresh
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="text-sm text-slate-600">
                            Total Contents: {analytics.total_contents}
                        </p>
                    </div>
                </div>

                <div className="p-4 sm:p-5">
                    <PaginatedSearchTable<PublishingRequest>
                        items={data?.data ?? []}
                        headers={[
                            { name: 'Content', position: 'left' },
                            { name: 'Batch & Source', position: 'left' },
                            { name: 'Period', position: 'center' },
                            { name: 'Publishing Date', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(request) => {
                            const isPublished = request.approval_status === 6;
                            const isPublishingCurrentRequest =
                                publishRequest.isPending &&
                                requestId === request.id;

                            return (
                                <tr
                                    key={request.id}
                                    className="border-b border-slate-100 bg-white hover:bg-sky-50/30"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <p className="font-semibold text-slate-900">
                                            {request.Title ||
                                                'Untitled content'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {request.Author || 'Unknown author'}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-sky-700">
                                            {request.HoldingsID ||
                                                'No holdings ID'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {request.batch?.batch_name ||
                                                'No batch'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {request.batch?.content_source ||
                                                'No source'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle text-sm text-slate-600">
                                        {request.batch?.quarter || 'N/A'} /{' '}
                                        {request.batch?.year || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <span className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock3 className="size-4 text-emerald-500" />
                                            {displayDate(
                                                isPublished
                                                    ? (request.published_at ??
                                                          '')
                                                    : (request.batch
                                                          ?.target_published_date ??
                                                          ''),
                                            )}
                                        </span>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {isPublished
                                                ? 'Published'
                                                : 'Target date'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span
                                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${isPublished ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}
                                        >
                                            {isPublished
                                                ? 'Published'
                                                : 'Ready'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <Button
                                            type="button"
                                            disabled={
                                                isPublished ||
                                                isPublishingCurrentRequest ||
                                                !request.id
                                            }
                                            onClick={() => {
                                                setRequestId(
                                                    request.id ?? null,
                                                );
                                                setIsConfirmationOpen(true);
                                            }}
                                            className="h-10 bg-sky-700 text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                        >
                                            <Send className="size-4" />
                                            {isPublishingCurrentRequest
                                                ? 'Publishing...'
                                                : isPublished
                                                  ? 'Published'
                                                  : 'Publish Content'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        }}
                        isLoading={isFetching}
                        emptyText="No publishing contents found."
                        currentPage={data?.current_page}
                        totalPages={data?.last_page}
                        nextPageUrl={data?.next_page_url}
                        prevPageUrl={data?.prev_page_url}
                        total={data?.total ?? 0}
                        itemsPerPage={data?.per_page ?? 10}
                        onPageChange={(url) => {
                            const nextPage = getPageFromUrl(url);
                            if (nextPage !== null) setPage(nextPage);
                        }}
                    />
                </div>
            </section>

            <ConfirmationDialog
                show={isConfirmationOpen}
                type={2}
                onClose={() => setIsConfirmationOpen(false)}
                message="Are you sure you want to publish this content?"
                onConfirm={handlePublish}
            />
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
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-sky-100 uppercase">
                <Icon className="size-3.5" /> {label}
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
