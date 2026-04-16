import { BatchModel } from "@/types/model";
import { CircleCheckBig, FileClock, TextSearch, BookOpenCheck, } from 'lucide-react';

export const getStats = (batches: BatchModel[]) => {
    return [
        {
            label: 'For Shortlisting',
            value: batches.filter(
                (batch) => batch.status === 'for shortlisting',
            ).length,
            icon: FileClock,
            cardTone:
                'border-sky-300 bg-gradient-to-br from-white via-amber-100 to-orange-200',
            tone: 'bg-white/80 text-amber-600 ring-amber-200',
        },
        {
            label: 'For Committee Review',
            value: batches.filter(
                (batch) => batch.status === 'for initial review',
            ).length,
            icon: FileClock,
            cardTone:
                'border-sky-300 bg-gradient-to-br from-white via-cyan-100 to-sky-200',
            tone: 'bg-white/80 text-cyan-600 ring-cyan-200',
        },
        {
            label: 'For Quality Approval',
            value: batches.filter(
                (batch) => batch.status === 'for quality approval',
            ).length,
            icon: TextSearch,
            cardTone:
                'border-sky-300 bg-gradient-to-br from-white via-fuchsia-100 to-rose-200',
            tone: 'bg-white/80 text-fuchsia-600 ring-fuchsia-200',
        },
        {
            label: 'Ready to publish',
            value: batches.filter((batch) => batch.status === 'for publishing')
                .length,
            icon: CircleCheckBig,
            cardTone:
                'border-sky-300 bg-gradient-to-br from-white via-emerald-100 to-teal-200',
            tone: 'bg-white/80 text-emerald-600 ring-emerald-200',
        },
        {
            label: 'Published',
            value: batches.filter((batch) => batch.status === 'published')
                .length,
            icon: BookOpenCheck,
            cardTone:
                'border-sky-300 bg-gradient-to-br from-white via-lime-100 to-emerald-200',
            tone: 'bg-white/80 text-lime-700 ring-lime-200',
        },
    ];
};

export const getStatusTone = (status?: string) => {
    switch (status) {
        case 'published':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'for publishing':
            return 'border-teal-200 bg-teal-50 text-teal-700';
        case 'for quality approval':
            return 'border-violet-200 bg-violet-50 text-violet-700';
        case 'for initial review':
            return 'border-cyan-200 bg-cyan-50 text-cyan-700';
        case 'for shortlisting':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-600';
    }
};

export const getStatusColor = (target?: string, actual?: string) => {
    if (!actual) return 'text-gray-400';

    const t = new Date(target as string);
    const a = new Date(actual);

    return a > t ? 'text-red-500' : 'text-green-500';
};

export const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 2000; i--) {
        years.push(i);
    }
    return years;
};

