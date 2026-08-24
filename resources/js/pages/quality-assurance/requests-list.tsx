import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Eye,
    FileScan,
    RefreshCw,
    Search,
    ShieldX,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import ViewContent from '@/components/custom/view-content';
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
import { purifyDom, trimText } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel } from '@/types/model';

type RequestAnalytics = {
    pending: number;
    approved: number;
    disapproved: number;
};

type RequestFilters = {
    quarter: string;
    year: string;
    search: string;
};

type PaginatedApprovalRequests = {
    data: RequestModel[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
    per_page: number;
};

const statusItems = [
    {
        key: 'pending',
        label: 'Pending',
        icon: Clock3,
        tone: 'border-sky-100 bg-sky-50 text-sky-700',
    },
    {
        key: 'approved',
        label: 'Approved',
        icon: CheckCircle2,
        tone: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
        key: 'disapproved',
        label: 'Disapproved',
        icon: ShieldX,
        tone: 'border-rose-100 bg-rose-50 text-rose-700',
    },
] as const;

function getStatus(status?: number): { label: string; className: string } {
    if (status === 2)
        return {
            label: 'Pending',
            className: 'border-sky-200 bg-sky-50 text-sky-700',
        };
    if (status === 4)
        return {
            label: 'Approved',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        };
    if (status === 5)
        return {
            label: 'Disapproved',
            className: 'border-rose-200 bg-rose-50 text-rose-700',
        };

    return {
        label: 'Not queued',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
}

export default function QualityAssuranceRequestsList(): JSX.Element {
    const { props } = usePage<{
        approval_requests?: PaginatedApprovalRequests;
        filters?: RequestFilters;
        quarters?: string[];
        years?: string[];
        analytics?: RequestAnalytics;
    }>();
    const approvalRequests = props.approval_requests?.data ?? [];
    const analytics = props.analytics ?? {
        pending: 0,
        approved: 0,
        disapproved: 0,
    };
    const quarters = props.quarters ?? [];
    const years = props.years ?? [];
    const [filters, setFilters] = useState<RequestFilters>(
        props.filters ?? {
            quarter: 'all',
            year: 'all',
            search: '',
        },
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedContent, setSelectedContent] = useState<RequestModel | null>(
        null,
    );
    const [isContentOpen, setIsContentOpen] = useState(false);

    const applyFilters = (nextFilters: RequestFilters): void => {
        setFilters(nextFilters);
        router.get('/quality-assurance-page', nextFilters, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const changeFilter = <K extends keyof RequestFilters>(
        key: K,
        value: RequestFilters[K],
    ): void => {
        applyFilters({ ...filters, [key]: value });
    };

    const changePage = (url: string | null): void => {
        if (!url) return;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const refreshRequests = (): void => {
        router.reload({
            only: ['approval_requests', 'analytics', 'quarters', 'years'],
            onStart: () => setIsRefreshing(true),
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Quality Assurance Requests
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
                            Review and track the content requests assigned to
                            you.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {statusItems.map(({ key, label, icon: Icon, tone }) => (
                            <div
                                key={key}
                                className={`min-w-28 rounded-xl border px-3 py-2 ${tone}`}
                            >
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase">
                                    <Icon className="size-3.5" />
                                    {label}
                                </p>
                                <p className="mt-1 text-2xl leading-none font-bold">
                                    {analytics[key]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Card className="gap-0 rounded-2xl border-sky-200 py-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="mb-4 flex w-full flex-col gap-3 py-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="w-full lg:w-72">
                            <div className="relative">
                                <Search className="absolute top-3.5 left-3 size-4 text-sky-500" />
                                <Input
                                    value={filters.search}
                                    placeholder="Search requests"
                                    className="border-sky-200 bg-white ps-9 text-slate-700"
                                    onChange={(event) =>
                                        setFilters((current) => ({
                                            ...current,
                                            search: event.target.value,
                                        }))
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters(filters);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="w-full sm:w-48">
                                <Select
                                    value={filters.quarter}
                                    onValueChange={(value) =>
                                        changeFilter('quarter', value)
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Filter by quarter"
                                        className="text-gray-500"
                                    >
                                        <SelectValue placeholder="All quarters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All quarters
                                        </SelectItem>
                                        {quarters.map((quarter) => (
                                            <SelectItem
                                                key={quarter}
                                                value={quarter}
                                            >
                                                {quarter}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-40">
                                <Select
                                    value={filters.year}
                                    onValueChange={(value) =>
                                        changeFilter('year', value)
                                    }
                                >
                                    <SelectTrigger
                                        aria-label="Filter by year"
                                        className="text-gray-500"
                                    >
                                        <SelectValue placeholder="All years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All years
                                        </SelectItem>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={refreshRequests}
                                disabled={isRefreshing}
                                className="border-sky-200 text-sky-700 hover:bg-sky-50"
                            >
                                <RefreshCw
                                    className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <PaginatedSearchTable<RequestModel>
                        items={approvalRequests}
                        headers={[
                            { name: 'Holdings ID', position: 'left' },
                            { name: 'Title & Author', position: 'left' },
                            { name: 'Abstract', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(request) => {
                            const status = getStatus(request.approval_status);

                            return (
                                <tr
                                    key={request.id ?? request.HoldingsID}
                                    className="border-b border-slate-100 bg-white hover:bg-sky-50/30"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {request.HoldingsID || 'N/A'}
                                        </p>
                                        <p className="mt-1 text-xs tracking-wide text-slate-400 uppercase">
                                            {request.MaterialType ||
                                                'Unspecified type'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {request.Title ||
                                                'Untitled request'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {request.Author || 'Unknown author'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {request.Abstracts ? (
                                            <div
                                                className="max-w-2xl text-sm leading-6 text-slate-600"
                                                dangerouslySetInnerHTML={{
                                                    __html: purifyDom(
                                                        trimText(
                                                            request.Abstracts,
                                                            220,
                                                        ) ?? '',
                                                    ),
                                                }}
                                            />
                                        ) : (
                                            <span className="text-sm text-slate-400">
                                                Not set
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <span
                                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                                        >
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex justify-center gap-2">
                                            {request.approval_status === 2 &&
                                            request.HoldingsID ? (
                                                <Link
                                                    href={`/quality-assurance-request/${request.HoldingsID}`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                                                >
                                                    <FileScan className="size-4" />{' '}
                                                    Review
                                                </Link>
                                            ) : null}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedContent(request);
                                                    setIsContentOpen(true);
                                                }}
                                                aria-label={`View ${request.Title ?? 'request'}`}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                        itemsPerPage={props.approval_requests?.per_page ?? 10}
                        emptyText="No assigned requests found."
                        currentPage={props.approval_requests?.current_page}
                        totalPages={props.approval_requests?.last_page}
                        nextPageUrl={props.approval_requests?.next_page_url}
                        prevPageUrl={props.approval_requests?.prev_page_url}
                        total={props.approval_requests?.total}
                        onPageChange={changePage}
                    />
                </CardContent>
            </Card>

            <ViewContent
                show={isContentOpen}
                onClose={() => setIsContentOpen(false)}
                data={selectedContent as RequestModel}
            />
        </div>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Quality Assurance Requests', href: '/quality-assurance-page' },
];

QualityAssuranceRequestsList.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
