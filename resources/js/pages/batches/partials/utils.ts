export type EditableDateField =
    | 'start_date'
    | 'target_shortlist_date'
    | 'target_initial_review_date'
    | 'target_quality_approval_date'
    | 'target_published_date';

export type ScheduleMilestone = {
    key: EditableDateField;
    label: string;
    date: Date;
    accentClassName: string;
    fillColor: string;
    isOverride: boolean;
};

export type BatchSchedulePreview = {
    milestones: ScheduleMilestone[];
};

export function buildSchedulePreview(
    startDateValue: string,
    isDost: boolean,
    overrides: Partial<Record<EditableDateField, string>>,
): BatchSchedulePreview | null {
    const selectedDate = parseDateInput(startDateValue);

    if (!selectedDate) {
        return null;
    }

    const resolveDate = (
        field: EditableDateField,
        fallback: Date,
    ): { date: Date; isOverride: boolean } => {
        const overrideDate = parseDateInput(overrides[field] ?? '');

        if (overrideDate) {
            return { date: overrideDate, isOverride: true };
        }

        return { date: fallback, isOverride: false };
    };

    const shortlistMilestone = resolveDate(
        'target_shortlist_date',
        addWeekdays(selectedDate, 7),
    );

    const milestones: ScheduleMilestone[] = [
        {
            key: 'start_date',
            label: 'Start Date',
            date: selectedDate,
            accentClassName: 'border-sky-400',
            fillColor: '#0284c7',
            isOverride: false,
        },
        {
            key: 'target_shortlist_date',
            label: 'Shortlisting',
            date: shortlistMilestone.date,
            accentClassName:
                'border-emerald-400',
            fillColor: '#d1fae5',
            isOverride: shortlistMilestone.isOverride,
        },
    ];

    if (!isDost) {
        const initialReviewMilestone = resolveDate(
            'target_initial_review_date',
            addWeekdays(selectedDate, 28),
        );

        milestones.push({
            key: 'target_initial_review_date',
            label: 'Initial Review',
            date: initialReviewMilestone.date,
            accentClassName: 'border-green-400',
            fillColor: '#fef3c7',
            isOverride: initialReviewMilestone.isOverride,
        });
    }

    const qualityApprovalMilestone = resolveDate(
        'target_quality_approval_date',
        addWeekdays(selectedDate, isDost ? 14 : 42),
    );
    const publishedMilestone = resolveDate(
        'target_published_date',
        addWeekdays(selectedDate, isDost ? 19 : 47),
    );

    milestones.push(
        {
            key: 'target_quality_approval_date',
            label: 'Quality Approval',
            date: qualityApprovalMilestone.date,
            accentClassName: 'border-violet-400  ',
            fillColor: '#ede9fe',
            isOverride: qualityApprovalMilestone.isOverride,
        },
        {
            key: 'target_published_date',
            label: 'Publishing',
            date: publishedMilestone.date,
            accentClassName: 'border-cyan-400',
            fillColor: '#cffafe',
            isOverride: publishedMilestone.isOverride,
        },
    );

    return {
        milestones,
    };
}

export function addWeekdays(startDate: Date, weekdays: number): Date {
    const nextDate = new Date(startDate);
    let addedWeekdays = 0;

    while (addedWeekdays < weekdays) {
        nextDate.setDate(nextDate.getDate() + 1);
        const dayOfWeek = nextDate.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 5 && dayOfWeek !== 6) {
            addedWeekdays += 1;
        }
    }

    return nextDate;
}

export const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

export const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
});

export function normalizeDateValue(value?: string): string {
    if (!value) {
        return '';
    }

    return value.split('T')[0]?.split(' ')[0] ?? '';
}

export function parseDateInput(value: string): Date | null {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

export function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
