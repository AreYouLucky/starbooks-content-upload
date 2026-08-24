import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Eye, Pencil, RefreshCw, Search, Send, ShieldX } from 'lucide-react';
import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import ViewContent from '@/components/custom/view-content';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel } from '@/types/model';

type QARejectionLogDetail = {
    id: number;
    description?: string | null;
    remarks?: string | null;
};

type QARejectionLog = {
    id: number;
    remarks?: string | null;
    log_details?: QARejectionLogDetail[];
};

type QARejectedRequest = RequestModel & {
    approval_logs?: QARejectionLog[];
};

type RequestFilters = {
    quarter: string;
    year: string;
    search: string;
};

type PaginatedApprovalRequests = {
    data: QARejectedRequest[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
    per_page: number;
};

export default function QualityAssuranceRejectedRequestsList(): JSX.Element {
    const { props } = usePage<{
        approval_requests?: PaginatedApprovalRequests;
        filters?: RequestFilters;
        quarters?: string[];
        years?: string[];
    }>();
    const requests = props.approval_requests?.data ?? [];
    const [filters, setFilters] = useState<RequestFilters>(
        props.filters ?? { quarter: 'all', year: 'all', search: '' },
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedContent, setSelectedContent] = useState<RequestModel | null>(
        null,
    );
    const [requestToForward, setRequestToForward] =
        useState<RequestModel | null>(null);
    const [isForwarding, setIsForwarding] = useState(false);

    const applyFilters = (nextFilters: RequestFilters): void => {
        setFilters(nextFilters);
        router.get('/quality-assurance-rejected', nextFilters, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const forwardToQualityAssurance = async (): Promise<void> => {
        if (!requestToForward?.id) return;

        setIsForwarding(true);
        try {
            await axios.post(
                `/quality-assurance-rejected/${requestToForward.id}/forward`,
            );
            toast.success(
                'Request successfully forwarded to Quality Assurance.',
            );
            setRequestToForward(null);
            router.reload({
                only: ['approval_requests', 'quarters', 'years'],
            });
        } catch {
            toast.error('Unable to forward the request. Please try again.');
        } finally {
            setIsForwarding(false);
        }
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-rose-200 bg-linear-to-br from-rose-600 via-rose-500 to-orange-400 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            QA Rejected Requests
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-50">
                            Edit rejected content and forward it back to Quality
                            Assurance when it is ready.
                        </p>
                    </div>
                    <div className="min-w-36 rounded-xl border border-white/30 bg-white/15 px-4 py-3 backdrop-blur-sm">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase">
                            <ShieldX className="size-4" /> Rejected
                        </p>
                        <p className="mt-1 text-3xl font-bold">
                            {props.approval_requests?.total ?? 0}
                        </p>
                    </div>
                </div>
            </section>

            <Card className="gap-0 rounded-2xl border-rose-200 py-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="mb-4 flex w-full flex-col gap-3 py-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:w-72">
                            <Search className="absolute top-3.5 left-3 size-4 text-rose-500" />
                            <Input
                                value={filters.search}
                                placeholder="Search rejected requests"
                                className="border-rose-200 bg-white ps-9 text-slate-700"
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        search: event.target.value,
                                    }))
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter')
                                        applyFilters(filters);
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Select
                                value={filters.quarter}
                                onValueChange={(quarter) =>
                                    applyFilters({ ...filters, quarter })
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by quarter"
                                    className="w-full text-gray-500 sm:w-48"
                                >
                                    <SelectValue placeholder="All quarters" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All quarters
                                    </SelectItem>
                                    {(props.quarters ?? []).map((quarter) => (
                                        <SelectItem
                                            key={quarter}
                                            value={quarter}
                                        >
                                            {quarter}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.year}
                                onValueChange={(year) =>
                                    applyFilters({ ...filters, year })
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by year"
                                    className="w-full text-gray-500 sm:w-40"
                                >
                                    <SelectValue placeholder="All years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All years
                                    </SelectItem>
                                    {(props.years ?? []).map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isRefreshing}
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() =>
                                    router.reload({
                                        only: [
                                            'approval_requests',
                                            'quarters',
                                            'years',
                                        ],
                                        onStart: () => setIsRefreshing(true),
                                        onFinish: () => setIsRefreshing(false),
                                    })
                                }
                            >
                                <RefreshCw
                                    className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <PaginatedSearchTable<QARejectedRequest>
                        items={requests}
                        headers={[
                            { name: 'Holdings ID', position: 'left' },
                            { name: 'Title & Author', position: 'left' },
                            { name: 'Reason', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(request) => (
                            <tr
                                key={request.id ?? request.HoldingsID}
                                className="border-b border-slate-100 bg-white hover:bg-rose-50/30"
                            >
                                <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {request.HoldingsID || 'N/A'}
                                    </p>
                                    <p className="mt-1 text-xs tracking-wide text-slate-400 uppercase">
                                        {request.batch?.batch_name ||
                                            'No batch'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {request.Title || 'Untitled request'}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {request.Author || 'Unknown author'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    {request.approval_logs?.[0] ? (
                                        <div className="max-w-2xl space-y-2">
                                            {(
                                                request.approval_logs[0]
                                                    .log_details ?? []
                                            ).length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {request.approval_logs[0].log_details?.map(
                                                        (detail) => (
                                                            <span
                                                                key={detail.id}
                                                                className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
                                                            >
                                                                {detail.description ||
                                                                    detail.remarks ||
                                                                    'Unspecified reason'}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                            {request.approval_logs[0]
                                                .remarks ? (
                                                <p className="text-sm leading-6 whitespace-pre-wrap text-slate-600">
                                                    {
                                                        request.approval_logs[0]
                                                            .remarks
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">
                                            No rejection reason provided
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                                        Rejected
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            aria-label={`View ${request.Title ?? 'request'}`}
                                            onClick={() =>
                                                setSelectedContent(request)
                                            }
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                        {request.id ? (
                                            <Button asChild variant="outline">
                                                <Link
                                                    href={`/quality-assurance-rejected/${request.id}/edit`}
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            disabled={isForwarding}
                                            className="bg-sky-600 text-white hover:bg-sky-700"
                                            onClick={() =>
                                                setRequestToForward(request)
                                            }
                                        >
                                            <Send className="size-4" />
                                            Forward to QA
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        itemsPerPage={props.approval_requests?.per_page ?? 10}
                        emptyText="No QA rejected requests found."
                        currentPage={props.approval_requests?.current_page}
                        totalPages={props.approval_requests?.last_page}
                        nextPageUrl={props.approval_requests?.next_page_url}
                        prevPageUrl={props.approval_requests?.prev_page_url}
                        total={props.approval_requests?.total}
                        onPageChange={(url) => {
                            if (url) {
                                router.visit(url, {
                                    preserveScroll: true,
                                    preserveState: true,
                                });
                            }
                        }}
                    />
                </CardContent>
            </Card>

            <ViewContent
                show={selectedContent !== null}
                onClose={() => setSelectedContent(null)}
                data={selectedContent as RequestModel}
            />
            <ConfirmationDialog
                show={requestToForward !== null}
                onClose={() => setRequestToForward(null)}
                message="Are you sure you want to forward this request to Quality Assurance?"
                type={2}
                onConfirm={forwardToQualityAssurance}
            />
        </div>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'For Quality Assurance', href: '/quality-assurance-page' },
    { title: 'QA Rejected', href: '/quality-assurance-rejected' },
];

QualityAssuranceRejectedRequestsList.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
