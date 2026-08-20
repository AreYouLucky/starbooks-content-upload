import { ReactNode, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle2, Clock3, Eye, LockKeyhole, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ViewContent from '@/components/custom/view-content';
import { formatDate } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel, UserModel } from '@/types/model';

type Reviewer = Pick<UserModel, 'id' | 'full_name' | 'role'>;

type Assignment = {
    initial_reviewer_id?: number;
    quality_assurance_reviewer_id?: number;
};

type AssignmentAnalytics = {
    assigned: number;
    unassigned: number;
};

type AssignmentFilters = {
    quarter: string;
    year: string;
    search: string;
    unassigned_only: boolean;
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reviewer Assignments', href: '/view-assignment-designation' },
];

export default function RequestList() {
    const { props } = usePage<{
        approval_requests?: PaginatedApprovalRequests;
        initial_reviewers?: Reviewer[];
        quality_assurance_reviewers?: Reviewer[];
        filters?: AssignmentFilters;
        quarters?: string[];
        years?: string[];
        analytics?: AssignmentAnalytics;
    }>();
    const approvalRequests = props.approval_requests?.data ?? [];
    const [selectedContent, setSelectedContent] = useState<RequestModel | null>(null);
    const [isContentOpen, setIsContentOpen] = useState(false);
    const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filters, setFilters] = useState<AssignmentFilters>(props.filters ?? {
        quarter: 'all',
        year: 'all',
        search: '',
        unassigned_only: false,
    });
    const initialReviewers = props.initial_reviewers ?? [];
    const qualityAssuranceReviewers = props.quality_assurance_reviewers ?? [];
    const quarters = props.quarters ?? [];
    const years = props.years ?? [];
    const analytics = props.analytics ?? { assigned: 0, unassigned: 0 };

    const applyFilters = (nextFilters: AssignmentFilters): void => {
        setFilters(nextFilters);
        router.get('/view-assignment-designation', {
            quarter: nextFilters.quarter,
            year: nextFilters.year,
            search: nextFilters.search,
            unassigned_only: nextFilters.unassigned_only ? 1 : undefined,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const changeFilter = <K extends keyof AssignmentFilters>(key: K, value: AssignmentFilters[K]): void => {
        applyFilters({ ...filters, [key]: value });
    };

    const changePage = (url: string | null): void => {
        if (!url) {
            return;
        }

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const refreshRequests = (): void => {
        router.reload({
            only: ['approval_requests', 'initial_reviewers', 'quality_assurance_reviewers', 'analytics'],
            onStart: () => setIsRefreshing(true),
            onFinish: () => setIsRefreshing(false),
        });
    };

    const updateAssignment = async (request: RequestModel, assignment: Assignment): Promise<void> => {
        if (!request.id) {
            return;
        }

        setUpdatingRequestId(request.id);

        try {
            await axios.patch(`/approval-requests/${request.id}/assignments`, assignment);
            toast.success('Reviewer assignment updated.');
            router.reload({ only: ['approval_requests', 'analytics'] });
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ message?: string }>(error)
                ? error.response?.data?.message
                : undefined;
            toast.error(message ?? 'Unable to update the reviewer assignment.');
        } finally {
            setUpdatingRequestId(null);
        }
    };


    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 px-5 py-6 text-sky-50 shadow-sm md:px-8">
                <div className="flex flex-row justify-between">
                    <div className="h-full flex item-center flex-col">
                        <h1 className="text-2xl font-bold tracking-tight uppercase">Reviewer Assignments</h1>
                        <p className="mt-1 text-sm text-sky-50">Assign initial and quality assurance reviewers to each request.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className=" grid gap-3 sm:grid-cols-2 xl:max-w-md">
                            <div className="rounded-xl border border-emerald-100/70 bg-white/95 p-3 text-emerald-700 shadow-sm">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><CheckCircle2 className="size-4" /> Assigned</div>
                                <p className="mt-1 text-2xl font-bold leading-none">{analytics.assigned}</p>
                            </div>
                            <div className="rounded-xl border border-amber-100/70 bg-white/95 p-3 text-amber-700 shadow-sm">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><Clock3 className="size-4" /> Not yet assigned</div>
                                <p className="mt-1 text-2xl font-bold leading-none">{analytics.unassigned}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Card className="gap-0 rounded-2xl border-sky-200 py-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-row gap-4  py-2 w-full justify-between mb-2">
                        <div className="w-full sm:w-56">
                            <div className="relative">
                                <Search className="absolute top-3.5 left-3 size-4 text-sky-500" />
                                <Input
                                    value={filters.search}
                                    placeholder="Search requests"
                                    className="border-sky-200 bg-white ps-9 text-slate-700"
                                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters(filters);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-600">
                                <Checkbox
                                    checked={filters.unassigned_only}
                                    onCheckedChange={(checked) => changeFilter('unassigned_only', checked === true)}
                                    aria-label="Show not yet assigned requests only"
                                />
                                Not yet assigned only
                            </label>
                            <div className="w-full sm:w-48">
                                <Select value={filters.quarter} onValueChange={(value) => changeFilter('quarter', value)}>
                                    <SelectTrigger aria-label="Filter by quarter" className='text-gray-500'><SelectValue placeholder="All quarters" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All quarters</SelectItem>
                                        {quarters.map((quarter) => <SelectItem key={quarter} value={quarter}>{quarter}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-40">
                                <Select value={filters.year} onValueChange={(value) => changeFilter('year', value)}>
                                    <SelectTrigger aria-label="Filter by year" className='text-gray-500'>
                                        <SelectValue placeholder="All years" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All years</SelectItem>
                                        {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
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
                                <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                            { name: 'Initial Reviewer', position: 'left' },
                            { name: 'Quality Assurance', position: 'left' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(request) => {
                            const isDostBatch = Boolean(request.batch?.is_dost);
                            const isUpdating = updatingRequestId === request.id;

                            return (
                                <tr key={request.id ?? request.HoldingsID} className="border-b border-slate-100 bg-white transition hover:bg-slate-50">
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-semibold text-slate-900">{request.HoldingsID || 'N/A'}</p>
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{request.MaterialType || 'Unspecified'}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-medium text-slate-800">{request.batch?.batch_name ?? 'No batch'}</p>
                                        {isDostBatch && <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500"><LockKeyhole className="size-3" /> DOST batch</p>}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-semibold text-slate-900">{request.Title || 'Untitled request'}</p>
                                        <p className="text-sm text-slate-500">{request.Author || 'Unknown author'}</p>
                                    </td>
                                    <td className="min-w-56 px-4 py-4 align-middle">
                                        <div className="flex flex-col gap-1.5">
                                            <Select value={request.initial_reviewer_id?.toString()} disabled={isDostBatch || isUpdating} onValueChange={(value) => updateAssignment(request, { initial_reviewer_id: Number(value) })}>
                                                <SelectTrigger aria-label={`Initial reviewer for ${request.Title ?? request.HoldingsID}`}><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                                                <SelectContent>{initialReviewers.map((reviewer) => <SelectItem key={reviewer.id} value={reviewer.id.toString()}>{reviewer.full_name}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {request.initial_reviewed_assigned_date && (
                                                <p className="text-xs text-slate-500">Assigned {formatDate(request.initial_reviewed_assigned_date)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="min-w-56 px-4 py-4 align-middle">
                                        <div className="flex flex-col gap-1.5">
                                            <Select value={request.quality_assurance_reviewer_id?.toString()} disabled={isUpdating} onValueChange={(value) => updateAssignment(request, { quality_assurance_reviewer_id: Number(value) })}>
                                                <SelectTrigger aria-label={`Quality assurance reviewer for ${request.Title ?? request.HoldingsID}`}><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                                                <SelectContent>{qualityAssuranceReviewers.map((reviewer) => <SelectItem key={reviewer.id} value={reviewer.id.toString()}>{reviewer.full_name}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {request.quality_assurance_assigned_date && (
                                                <p className="text-xs text-slate-500">Assigned {formatDate(request.quality_assurance_assigned_date)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center align-middle">
                                        <Button size="icon" aria-label={`View ${request.Title ?? request.HoldingsID}`} onClick={() => { setSelectedContent(request); setIsContentOpen(true); }}><Eye className="size-4" /></Button>
                                    </td>
                                </tr>
                            );
                        }}
                        itemsPerPage={props.approval_requests?.per_page ?? 10}
                        emptyText="No requests found."
                        currentPage={props.approval_requests?.current_page}
                        totalPages={props.approval_requests?.last_page}
                        nextPageUrl={props.approval_requests?.next_page_url}
                        prevPageUrl={props.approval_requests?.prev_page_url}
                        total={props.approval_requests?.total}
                        onPageChange={changePage}
                    />
                </CardContent>
            </Card>
            <ViewContent show={isContentOpen} onClose={() => setIsContentOpen(false)} data={selectedContent as RequestModel} />
        </div>
    );
}

RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
