import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Eye, FileScan, ShieldX } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import ViewContent from '@/components/custom/view-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table';
import { purifyDom, trimText } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel, BatchModel } from '@/types/model';

type RequestAnalytics = {
    pending: number;
    approved: number;
    disapproved: number;
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
        approval_requests?: RequestModel[];
        batch?: BatchModel;
    }>();
    const approvalRequests = props.approval_requests ?? [];
    const batch = props.batch;
    const [selectedContent, setSelectedContent] =
        useState<RequestModel | null>(null);
    const [isContentOpen, setIsContentOpen] = useState(false);
    const analytics = approvalRequests.reduce<RequestAnalytics>(
        (totals, request) => {
            if (request.approval_status === 2)
                return { ...totals, pending: totals.pending + 1 };
            if (request.approval_status === 4)
                return { ...totals, approved: totals.approved + 1 };
            if (request.approval_status === 5)
                return { ...totals, disapproved: totals.disapproved + 1 };

            return totals;
        },
        { pending: 0, approved: 0, disapproved: 0 },
    );

    return (
        <div className="space-y-5 p-1">
            <section className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                            Quality Assurance
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            {batch?.batch_name ?? 'Requests List'}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
                            {batch?.batch_description}
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
                <CardContent className="p-2">
                    <PaginatedSearchTable<RequestModel>
                        items={approvalRequests}
                        headers={[
                            { name: 'Holdings ID', position: 'left' },
                            { name: 'Title & Author', position: 'left' },
                            { name: 'Abstract', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        searchBy={(request) =>
                            `${request.Title ?? ''} ${request.Author ?? ''} ${request.HoldingsID ?? ''}`
                        }
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
                        itemsPerPage={5}
                        searchPlaceholder="Search requests"
                        emptyText="No requests found for this batch."
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
    { title: 'Quality Assurance Batches', href: '/quality-assurance-page' },
    { title: 'Requests List', href: '/quality-assurance-page' },
];

QualityAssuranceRequestsList.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
