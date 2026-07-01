import { Head } from '@inertiajs/react';
import type { JSX, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangle,
    Archive,
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Layers3,
    ShieldCheck,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { quarters } from '@/lib/default';
import type { BreadcrumbItem } from '@/types';
import { generateYears } from '../batches/partials/defaults';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type DashboardScope = 'all' | 'filtered';

type CountItem = {
    name: string;
    value: number;
};

type QuarterTrendItem = {
    period: string;
    batches: number;
    records: number;
    published: number;
};

type RecentBatch = {
    id: number;
    batch_name: string;
    content_source: string;
    quarter: string;
    year: string;
    status: string | null;
    records_count: number;
};

type UrgentBatch = RecentBatch & {
    target_date: string | null;
    stage: string;
    days_late: number;
};

type DashboardSummary = {
    batches: number;
    records: number;
    shortlisted: number;
    initial_reviewed: number;
    quality_reviewed: number;
    published: number;
};

type DashboardData = {
    summary: DashboardSummary;
    batch_statuses: CountItem[];
    record_statuses: CountItem[];
    review_decisions: CountItem[];
    source_distribution: CountItem[];
    quarter_trend: QuarterTrendItem[];
    urgent_batches: UrgentBatch[];
    recent_batches: RecentBatch[];
};

type StatItem = {
    label: string;
    value: number;
    detail: string;
    icon: typeof Layers3;
    tone: string;
};

const emptyDashboardData: DashboardData = {
    summary: {
        batches: 0,
        records: 0,
        shortlisted: 0,
        initial_reviewed: 0,
        quality_reviewed: 0,
        published: 0,
    },
    batch_statuses: [],
    record_statuses: [],
    review_decisions: [],
    source_distribution: [],
    quarter_trend: [],
    urgent_batches: [],
    recent_batches: [],
};

const chartColors = [
    '#0ea5e9',
    '#38bdf8',
    '#7dd3fc',
    '#bae6fd',
    '#67e8f9',
    '#93c5fd',
    '#64748b',
];

const formatStatus = (status: string | null): string => {
    if (!status) return 'Unspecified';

    return status
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getStatusTone = (status: string | null): string => {
    switch (status) {
        case 'published':
            return 'border-sky-200 bg-sky-50 text-sky-700';
        case 'for publishing':
            return 'border-sky-200 bg-white text-sky-700';
        case 'for quality approval':
            return 'border-cyan-200 bg-cyan-50 text-cyan-700';
        case 'for initial review':
            return 'border-sky-100 bg-white text-slate-700';
        case 'for shortlisting':
            return 'border-sky-100 bg-sky-50 text-slate-600';
        default:
            return 'border-slate-200 bg-white text-slate-600';
    }
};

const toPercent = (value: number, total: number): string => {
    if (total === 0) return '0%';

    return `${Math.round((value / total) * 100)}%`;
};

const formatDate = (value: string | null): string => {
    if (!value) return 'No target date';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'Asia/Manila',
    }).format(date);
};

export default function Dashboard(): JSX.Element {
    const [scope, setScope] = useState<DashboardScope>('all');
    const [quarter, setQuarter] = useState('');
    const [year, setYear] = useState('');
    const [data, setData] = useState<DashboardData>(emptyDashboardData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const years = generateYears();
    const canLoadFiltered = scope === 'all' || (quarter !== '' && year !== '');

    const queryString = useMemo((): string => {
        const params = new URLSearchParams({ scope });

        if (scope === 'filtered') {
            params.set('quarter', quarter);
            params.set('year', year);
        }

        return params.toString();
    }, [quarter, scope, year]);

    useEffect(() => {
        if (!canLoadFiltered) {
            return;
        }

        const controller = new AbortController();
        setIsLoading(true);
        setError('');

        fetch(`/dashboard-data?${queryString}`, {
            credentials: 'include',
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load dashboard data.');
                }

                return response.json() as Promise<DashboardData>;
            })
            .then((response) => {
                setData(response);
            })
            .catch((fetchError: unknown) => {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === 'AbortError'
                ) {
                    return;
                }

                setError('Dashboard data could not be loaded.');
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => controller.abort();
    }, [canLoadFiltered, queryString]);

    const statItems: StatItem[] = [
        {
            label: 'Total Batches',
            value: data.summary.batches,
            detail: 'active reporting scope',
            icon: Layers3,
            tone: 'text-sky-600 bg-sky-50 border-sky-100',
        },
        {
            label: 'Total Records',
            value: data.summary.records,
            detail: 'all content records',
            icon: Archive,
            tone: 'text-cyan-600 bg-cyan-50 border-cyan-100',
        },
        {
            label: 'Shortlisted',
            value: data.summary.shortlisted,
            detail: toPercent(data.summary.shortlisted, data.summary.records),
            icon: ClipboardCheck,
            tone: 'text-sky-600 bg-white border-sky-100',
        },
        {
            label: 'Initial Reviewed',
            value: data.summary.initial_reviewed,
            detail: toPercent(
                data.summary.initial_reviewed,
                data.summary.records,
            ),
            icon: CheckCircle2,
            tone: 'text-sky-600 bg-sky-50 border-sky-100',
        },
        {
            label: 'QA Reviewed',
            value: data.summary.quality_reviewed,
            detail: toPercent(
                data.summary.quality_reviewed,
                data.summary.records,
            ),
            icon: ShieldCheck,
            tone: 'text-cyan-600 bg-cyan-50 border-cyan-100',
        },
        {
            label: 'Published',
            value: data.summary.published,
            detail: toPercent(data.summary.published, data.summary.records),
            icon: BookOpenCheck,
            tone: 'text-sky-700 bg-sky-50 border-sky-200',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-5 ">
                <section className="rounded-lg border border-sky-200 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-50">
                                Content Dashboard
                            </h1>
                            <p className="max-w-2xl text-sm text-slate-100">
                                Monitor all STARBOOKS content records across
                                shortlisting, reviews, quality assurance, and
                                publishing.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <div className="grid gap-1">
                                <span className="text-xs font-semibold text-slate-100">
                                    Scope
                                </span>
                                <div className="grid grid-cols-2 rounded-lg border border-sky-100 bg-sky-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setScope('all')}
                                        className={`h-9 rounded-md px-4 text-sm font-semibold transition ${
                                            scope === 'all'
                                                ? 'bg-sky-500 text-sky-50 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScope('filtered')}
                                        className={`h-9 rounded-md px-4 text-sm font-semibold transition ${
                                            scope === 'filtered'
                                                ? 'bg-sky-500 text-sky-50 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Quarter
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FilterSelect
                                    label="Quarter"
                                    value={quarter}
                                    placeholder="Select quarter"
                                    disabled={scope === 'all'}
                                    onValueChange={setQuarter}
                                    options={quarters.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                />
                                <FilterSelect
                                    label="Year"
                                    value={year}
                                    placeholder="Select year"
                                    disabled={scope === 'all'}
                                    onValueChange={setYear}
                                    options={years.map((item) => ({
                                        value: String(item),
                                        label: String(item),
                                    }))}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                                onClick={() => {
                                    setScope('all');
                                    setQuarter('');
                                    setYear('');
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <section className="rounded-lg border border-sky-100 bg-linear-to-br from-red-400 via-orange-300 to-orange-100 shadow-sm">
                    <div className="flex flex-col gap-2  px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-50">
                                <span className="rounded-md border border-sky-100 bg-sky-50 p-1.5 text-red-600">
                                    <AlertTriangle className="size-4" />
                                </span>
                                Needs Urgent Review
                            </h2>
                            <p className="mt-1 text-sm text-slate-100">
                                Late batches still waiting for review.
                            </p>
                        </div>
                        <span className="w-fit rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                            {data.urgent_batches.length} late batches
                        </span>
                    </div>
                    <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-4">
                        {data.urgent_batches.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-4 py-6 text-center text-sm text-slate-500 lg:col-span-2 xl:col-span-4">
                                No late review batches in this scope.
                            </div>
                        ) : (
                            data.urgent_batches.map((batch) => (
                                <div
                                    key={batch.id}
                                    className="rounded-lg border border-sky-100 bg-sky-50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {batch.batch_name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {batch.content_source} -{' '}
                                                {batch.quarter} {batch.year}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-sky-100 bg-red-500 px-2.5 py-1 text-[11px] font-bold text-sky-50">
                                            {batch.days_late}d late
                                        </span>
                                    </div>
                                    <div className="mt-4 grid gap-2 text-xs">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-500">
                                                Stage
                                            </span>
                                            <span className="font-semibold text-sky-700">
                                                {batch.stage}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-500">
                                                Target
                                            </span>
                                            <span className="font-semibold text-slate-700">
                                                {formatDate(batch.target_date)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-500">
                                                Records
                                            </span>
                                            <span className="font-semibold text-slate-700">
                                                {batch.records_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {statItems.map((item) => (
                        <StatCard
                            key={item.label}
                            item={item}
                            loading={isLoading}
                        />
                    ))}
                </section>


                <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                    <ChartPanel
                        title="Approval Status"
                        subtitle="Current content approval movement across the different stages of reviews"
                    >
                        <ResponsiveContainer width="100%" height={420}>
                            <BarChart data={data.record_statuses}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                    height={72}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    name="Records"
                                    fill="#38bdf8"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel
                        title="Batch Status"
                        subtitle="Batch volume by current status"
                    >
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={data.batch_statuses}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={68}
                                    outerRadius={112}
                                    paddingAngle={2}
                                >
                                    {data.batch_statuses.map((entry, index) => (
                                        <Cell
                                            key={entry.name}
                                            fill={
                                                chartColors[
                                                    index % chartColors.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <ChartLegend items={data.batch_statuses} />
                    </ChartPanel>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <ChartPanel
                        title="Review Decisions"
                        subtitle="Approval and disapproval volume by review stage"
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.review_decisions}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    interval={0}
                                    angle={-12}
                                    textAnchor="end"
                                    height={64}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    name="Records"
                                    fill="#38bdf8"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <ChartPanel
                        title="Content Sources"
                        subtitle="Batch volume by source"
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={data.source_distribution}
                                layout="vertical"
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={110}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    name="Batches"
                                    fill="#38bdf8"
                                    radius={[0, 6, 6, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                    <ChartPanel
                        title="Quarter Trend"
                        subtitle="Batches, records, and published records by period"
                    >
                        <ResponsiveContainer width="100%" height={420}>
                            <BarChart data={data.quarter_trend}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="batches"
                                    fill="#7dd3fc"
                                    name="Batches"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="records"
                                    fill="#0ea5e9"
                                    name="Records"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="published"
                                    fill="#38bdf8"
                                    name="Published"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartPanel>

                    <section className="rounded-lg border border-sky-100 bg-white shadow-sm">
                        <div className="border-b border-sky-100 px-5 py-4">
                            <h2 className="text-base font-bold text-slate-900">
                                Recent Batches
                            </h2>
                            <p className="text-sm text-slate-500">
                                Latest batch activity in the selected scope.
                            </p>
                        </div>
                        <div className="divide-y divide-sky-50">
                            {data.recent_batches.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm text-slate-500">
                                    No batches found.
                                </div>
                            ) : (
                                data.recent_batches.map((batch) => (
                                    <div
                                        key={batch.id}
                                        className="flex items-start justify-between gap-3 px-5 py-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {batch.batch_name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {batch.content_source} -{' '}
                                                {batch.quarter} {batch.year}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusTone(
                                                    batch.status,
                                                )}`}
                                            >
                                                {formatStatus(batch.status)}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {batch.records_count} records
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </section>
            </div>
        </AppLayout>
    );
}

function FilterSelect({
    label,
    value,
    placeholder,
    disabled,
    onValueChange,
    options,
}: {
    label: string;
    value: string;
    placeholder: string;
    disabled: boolean;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
}): JSX.Element {
    return (
        <div className="grid gap-1">
            <span className="text-xs font-semibold text-slate-100">
                {label}
            </span>
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger className="h-11 min-w-40 border-slate-300 bg-white disabled:bg-slate-50">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function StatCard({
    item,
    loading,
}: {
    item: StatItem;
    loading: boolean;
}): JSX.Element {
    return (
        <div className="rounded-lg border border-sky-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
                        {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {loading ? '...' : item.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                </div>
                <div className={`rounded-lg border p-2.5 ${item.tone}`}>
                    <item.icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function ChartPanel({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-sky-50 pb-3">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}

function ChartLegend({ items }: { items: CountItem[] }): JSX.Element {
    return (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.map((item, index) => (
                <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-md border border-sky-100 bg-sky-50/30 px-3 py-2 text-xs"
                >
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                        <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                                backgroundColor:
                                    chartColors[index % chartColors.length],
                            }}
                        />
                        <span className="truncate">
                            {formatStatus(item.name)}
                        </span>
                    </span>
                    <span className="font-bold text-slate-900">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
