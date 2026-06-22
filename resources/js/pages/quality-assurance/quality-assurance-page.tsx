import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Eye,
    FileSpreadsheet,
    FolderSync,
    Forward,
    Search,
    ShieldX,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { useHandleChange } from '@/hooks/use-handle-change';
import { displayDate, getPageFromUrl } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { BatchModel } from '@/types/model';
import {
    getQualityAssuranceErrorMessage,
    useFetchQualityAssurance,
    useForwardToPublishing,
} from './partials/quality-assurance-hooks';
import GenerateReport from './partials/generate-report';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'For Quality Assurance', href: '/quality-assurance-page' },
];

const summaryItems = [
    {
        key: 'pending',
        label: 'Pending',
        icon: Clock3,
        tone: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
        key: 'approved',
        label: 'Approved',
        icon: CheckCircle2,
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
        key: 'rejected',
        label: 'Disapproved',
        icon: ShieldX,
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
    },
] as const;

export default function QualityAssurancePage(): JSX.Element {
    const [page, setPage] = useState(1);
    const [batchName, setBatchName] = useState('');
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);
    const { item, setItem } = useHandleChange({ search: '', batch_id: 0 });
    const debouncedSearch = useDebounce(item.search, 1000);
    const { data, isFetching, refetch } = useFetchQualityAssurance(page, {
        ...item,
        search: debouncedSearch,
    });
    const forwardToPublishing = useForwardToPublishing();
    const analytics = data?.analytics ?? {
        for_quality_assurance: 0,
        reviewed: 0,
    };

    const handleForward = (): void => {
        forwardToPublishing.mutate(
            { batchName },
            {
                onSuccess: (response) => {
                    setIsConfirmationOpen(false);
                    toast.success(response.message);
                },
                onError: (error) => {
                    setIsConfirmationOpen(false);
                    toast.error(getQualityAssuranceErrorMessage(error));
                },
            },
        );
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            Quality Assurance Batches
                        </h1>
                        <p className="text-sm leading-6 text-sky-50 sm:text-base">
                            Review quality approval requests and forward
                            completed batches for publishing.
                        </p>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
                        <SummaryCard
                            label="For Quality Assurance"
                            value={analytics.for_quality_assurance}
                            detail="active batches"
                        />
                        <SummaryCard
                            label="Reviewed"
                            value={analytics.reviewed}
                            detail="completed batches"
                        />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 sm:w-80">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-500" />
                            <Input
                                name="search"
                                placeholder="Search batch name or description..."
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
                    <Button
                        type="button"
                        onClick={() => setIsGenerateReportOpen(true)}
                        className="h-10 bg-sky-600 text-white hover:bg-sky-700"
                    >
                        <FileSpreadsheet className="size-4" /> Generate Report
                    </Button>
                </div>

                <div className="p-4 sm:p-5">
                    <PaginatedSearchTable<BatchModel>
                        items={data?.data ?? []}
                        headers={[
                            { name: 'Batch', position: 'left' },
                            { name: 'Source', position: 'left' },
                            { name: 'Target Date', position: 'left' },
                            { name: 'Review Summary', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(batch) => (
                            <tr
                                key={batch.id}
                                className="border-b border-slate-100 bg-white"
                            >
                                <td className="px-6 py-4 align-center">
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
                                        {displayDate(
                                            batch.target_quality_approval_date,
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="grid gap-1.5 sm:min-w-44">
                                        {summaryItems.map(
                                            ({
                                                key,
                                                label,
                                                icon: Icon,
                                                tone,
                                            }) => (
                                                <div
                                                    key={key}
                                                    className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${tone}`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Icon className="size-3.5" />
                                                        {label}
                                                    </span>
                                                    <span className="text-xs font-bold">
                                                        {batch[key] ?? 0}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Link
                                            href={`/view-quality-assurance-batch/${batch.batch_name}`}
                                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
                                        >
                                            <Eye className="size-4" /> View
                                            Requests
                                        </Link>
                                        <Button
                                            type="button"
                                            disabled={(batch.pending ?? 0) > 0}
                                            onClick={() => {
                                                setBatchName(batch.batch_name);
                                                setIsConfirmationOpen(true);
                                            }}
                                            className="h-10 bg-sky-700 text-white hover:bg-sky-800"
                                        >
                                            <Forward className="size-4" />{' '}
                                            Forward to Publishing
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        searchPlaceholder="Search batches"
                        onRefresh={() => refetch()}
                        isLoading={isFetching}
                        emptyText="No quality assurance batches found."
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

            <ConfirmationDialog
                show={isConfirmationOpen}
                type={2}
                onClose={() => setIsConfirmationOpen(false)}
                message="Are you sure you want to forward this batch for publishing?"
                onConfirm={handleForward}
            />
            <GenerateReport
                show={isGenerateReportOpen}
                onClose={() => setIsGenerateReportOpen(false)}
            />
        </div>
    );
}

function SummaryCard({
    label,
    value,
    detail,
}: {
    label: string;
    value: number;
    detail: string;
}): JSX.Element {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                {label}
            </p>
            <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold md:text-3xl">{value}</span>
                <span className="pb-1 text-xs text-sky-100">{detail}</span>
            </div>
        </div>
    );
}

QualityAssurancePage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
