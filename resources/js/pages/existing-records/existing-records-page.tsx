import { ReactNode, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArchiveRestore,
    Eye,
    FolderSync,
    PencilLine,
    Search,
    SendToBack,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ViewContent from '@/components/custom/view-content';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import type { BreadcrumbItem } from '@/types';
import type { ApprovalRequestModel, LkContentModel, RecordModel } from '@/types/model';
import { getPageFromUrl, trimText, purifyDom } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useRepublishRecord,
    useUnpublishRecord,
} from './partials/existing-record-hooks';

type RecordStatus = 'published' | 'unpublished';

type ExistingRecord = RecordModel & {
    record_status: RecordStatus;
};

type ExistingRecordsFilters = {
    content_group: string;
    status: 'all' | RecordStatus;
    search: string;
};

type ExistingRecordsAnalytics = {
    published: number;
    unpublished: number;
};

type PaginatedExistingRecords = {
    data: ExistingRecord[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
    per_page: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Existing Records', href: '/existing-records' },
];

export default function ExistingRecordsPage() {
    const { props } = usePage<{
        records?: PaginatedExistingRecords;
        contentGroups?: LkContentModel[];
        filters?: ExistingRecordsFilters;
        analytics?: ExistingRecordsAnalytics;
    }>();

    const records = props.records?.data ?? [];
    const contentGroups = props.contentGroups ?? [];
    const analytics = props.analytics ?? { published: 0, unpublished: 0 };
    const initialFilters = props.filters ?? {
        content_group: 'all',
        status: 'all',
        search: '',
    };

    const [filters, setFilters] = useState<ExistingRecordsFilters>(initialFilters);
    const [selectedRecord, setSelectedRecord] = useState<ExistingRecord | null>(null);
    const [pendingRecord, setPendingRecord] = useState<ExistingRecord | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const unpublishRecord = useUnpublishRecord();
    const republishRecord = useRepublishRecord();

    const totalRecords = analytics.published + analytics.unpublished;

    const contentGroupNames = useMemo(() => {
        return new Map(contentGroups.map((group) => [group.code, group.desc]));
    }, [contentGroups]);

    const applyFilters = (nextFilters: ExistingRecordsFilters): void => {
        setFilters(nextFilters);
        router.get('/existing-records', nextFilters, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const changePage = (url: string | null): void => {
        const nextPage = getPageFromUrl(url);

        if (nextPage === null) {
            return;
        }

        router.get(
            '/existing-records',
            {
                ...filters,
                page: nextPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const changeFilter = <K extends keyof ExistingRecordsFilters>(
        key: K,
        value: ExistingRecordsFilters[K],
    ): void => {
        applyFilters({
            ...filters,
            [key]: value,
        });
    };

    const viewRecord = (record: ExistingRecord): void => {
        setSelectedRecord(record);
        setIsViewOpen(true);
    };

    const confirmStatusChange = (record: ExistingRecord): void => {
        setPendingRecord(record);
        setIsConfirmOpen(true);
    };

    const changeStatus = (): void => {
        if (!pendingRecord) {
            return;
        }

        const mutation =
            pendingRecord.record_status === 'published'
                ? unpublishRecord
                : republishRecord;

        mutation.mutate(pendingRecord.id, {
            onSuccess: () => {
                toast.success(
                    pendingRecord.record_status === 'published'
                        ? 'Record unpublished successfully'
                        : 'Record republished successfully',
                );
                setIsConfirmOpen(false);
                setPendingRecord(null);
                router.reload({ only: ['records', 'analytics'] });
            },
        });
    };

    return (
        <div className="space-y-4">
            <section className="relative overflow-hidden rounded-lg border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 text-white shadow-sm md:p-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">Existing Records</h1>
                        <p className="max-w-2xl text-sm leading-6 text-sky-50">
                            Manage published and unpublished records by content group.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <SummaryCard label="Published" value={analytics.published} />
                        <SummaryCard label="Unpublished" value={analytics.unpublished} />
                        <SummaryCard label="Total" value={totalRecords} />
                    </div>
                </div>
            </section>

            <Card className="gap-0 overflow-hidden rounded-lg border-sky-300 bg-white py-0 shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-sky-50/70 px-5 py-4 lg:flex-row lg:items-center">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <Select
                            value={filters.content_group}
                            onValueChange={(value) =>
                                changeFilter('content_group', value)
                            }
                        >
                            <SelectTrigger className="h-10 min-w-52 border-sky-200 bg-white">
                                <SelectValue placeholder="Content group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All content groups</SelectItem>
                                {contentGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.code}>
                                        {group.desc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status}
                            onValueChange={(value) =>
                                changeFilter(
                                    'status',
                                    value as ExistingRecordsFilters['status'],
                                )
                            }
                        >
                            <SelectTrigger className="h-10 min-w-44 border-sky-200 bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="unpublished">Unpublished</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative">
                            <Search className="absolute top-3 left-3 text-sky-500" size={16} />
                            <Input
                                id="search"
                                name="search"
                                type="text"
                                value={filters.search}
                                placeholder="Search records..."
                                className="h-10 min-w-62.5 border-sky-200 bg-white ps-9 shadow-none"
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

                    <Button
                        type="button"
                        className="h-10 rounded-lg bg-sky-600 px-4 text-slate-50"
                        onClick={() => applyFilters(filters)}
                    >
                        <FolderSync className="size-4" />
                        Refresh
                    </Button>
                </div>

                <CardContent className="overflow-x-auto p-2">
                    <PaginatedSearchTable<ExistingRecord>
                        items={records}
                        itemsPerPage={props.records?.per_page ?? 8}
                        emptyText="No existing records found."
                        headers={[
                            { name: 'Holdings ID', position: 'left' },
                            { name: 'Title & Author', position: 'left' },
                            { name: 'Content Group', position: 'left' },
                            { name: 'Abstract', position: 'left' },
                            { name: 'Status', position: 'center' },
                            { name: 'Actions', position: 'center' },
                        ]}
                        renderRow={(record) => (
                            <tr
                                key={`${record.record_status}-${record.id}`}
                                className="border-b border-gray-100 bg-white transition hover:bg-gray-100/40"
                            >
                                <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {record.HoldingsID || 'N/A'}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        {record.MaterialType || 'Unspecified Type'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {record.Title || 'Untitled record'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {record.Author || 'Unknown author'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-slate-700">
                                        {contentGroupNames.get(record.Contents ?? '') ??
                                            record.Contents ??
                                            'Not set'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div
                                        className="max-w-xl text-sm leading-6 text-slate-600"
                                        dangerouslySetInnerHTML={{
                                            __html: purifyDom(
                                                trimText(String(record.Abstracts ?? ''), 180) ||
                                                    'Not set',
                                            ),
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <span
                                        className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${
                                            record.record_status === 'published'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {record.record_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            type="button"
                                            popover="View record"
                                            aria-label="View record"
                                            className="h-9 rounded-lg bg-sky-600 px-3 text-white"
                                            onClick={() => viewRecord(record)}
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                        <Button
                                            asChild
                                            type="button"
                                            variant="outline"
                                            popover="Edit record"
                                            aria-label="Edit record"
                                            className="h-9 rounded-lg border-sky-300 px-3 text-sky-600 hover:bg-sky-600 hover:text-white"
                                        >
                                            <Link
                                                href={`/existing-records/${record.record_status}/${record.id}/edit`}
                                            >
                                                <PencilLine className="size-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            popover={
                                                record.record_status === 'published'
                                                    ? 'Unpublish record'
                                                    : 'Republish record'
                                            }
                                            aria-label={
                                                record.record_status === 'published'
                                                    ? 'Unpublish record'
                                                    : 'Republish record'
                                            }
                                            className="h-9 rounded-lg border-slate-200 px-3"
                                            onClick={() => confirmStatusChange(record)}
                                        >
                                            {record.record_status === 'published' ? (
                                                <SendToBack className="size-4" />
                                            ) : (
                                                <ArchiveRestore className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        currentPage={props.records?.current_page}
                        totalPages={props.records?.last_page}
                        nextPageUrl={props.records?.next_page_url}
                        prevPageUrl={props.records?.prev_page_url}
                        total={props.records?.total ?? 0}
                        onPageChange={changePage}
                    />
                </CardContent>
            </Card>

            <ViewContent
                show={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                data={selectedRecord as ApprovalRequestModel | null}
            />
            <ConfirmationDialog
                show={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                message={
                    pendingRecord?.record_status === 'published'
                        ? 'Are you sure you want to unpublish this record?'
                        : 'Are you sure you want to republish this record?'
                }
                type={2}
                onConfirm={changeStatus}
            />
        </div>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-sky-100 uppercase">
                {label}
            </p>
            <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
    );
}

ExistingRecordsPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
