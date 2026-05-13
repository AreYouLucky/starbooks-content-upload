import { BatchModel } from '@/types/model';
import {
    CircleCheckBig,
    FileClock,
    TextSearch,
    BookOpenCheck,
} from 'lucide-react';

export const getStats = (batches: BatchModel[]) => {
    return [
        {
            label: 'For Shortlisting',
            value: batches.filter(
                (batch) => batch.status === 'for shortlisting',
            ).length,
            icon: FileClock,
            cardTone: 'border-sky-200 bg-white',
            tone: 'bg-white/80 text-sky-600 ring-sky-200',
        },
        {
            label: 'For Committee Review',
            value: batches.filter(
                (batch) => batch.status === 'for initial review',
            ).length,
            icon: FileClock,
            cardTone: 'border-sky-200 bg-white',
            tone: 'bg-white/80 text-sky-700 ring-sky-200',
        },
        {
            label: 'For Quality Approval',
            value: batches.filter(
                (batch) => batch.status === 'for quality approval',
            ).length,
            icon: TextSearch,
            cardTone: 'border-sky-200 bg-white',
            tone: 'bg-white/80 text-sky-800 ring-sky-200',
        },
        {
            label: 'Ready to publish',
            value: batches.filter((batch) => batch.status === 'for publishing')
                .length,
            icon: CircleCheckBig,
            cardTone: 'border-sky-200 bg-white',
            tone: 'bg-white/80 text-sky-700 ring-sky-200',
        },
        {
            label: 'Published',
            value: batches.filter((batch) => batch.status === 'published')
                .length,
            icon: BookOpenCheck,
            cardTone: 'border-sky-200 bg-white',
            tone: 'bg-white/80 text-sky-900 ring-sky-200',
        },
    ];
};

export const getStatusTone = (status?: string) => {
    switch (status) {
        case 'published':
            return 'border-sky-300 bg-sky-100 text-sky-900';
        case 'for publishing':
            return 'border-sky-300 bg-sky-50 text-sky-800';
        case 'for quality approval':
            return 'border-sky-200 bg-white text-sky-700';
        case 'for initial review':
            return 'border-sky-200 bg-sky-50 text-sky-700';
        case 'for shortlisting':
            return 'border-sky-200 bg-sky-50 text-sky-600';
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
