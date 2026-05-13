import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/text-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCreateBatch, useUpdateBatch } from './batches-hooks';
import { useHandleChange } from '@/hooks/use-handle-change';
import { BatchModel } from '@/types/model';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { generateYears } from './defaults';
import { quarters } from '@/lib/default';
import { Checkbox } from '@/components/ui/checkbox';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { PencilLine } from 'lucide-react';
import {
    EditableDateField,
    normalizeDateValue,
    buildSchedulePreview,
    parseDateInput,
    formatDateInput,
    fullDateFormatter,
    weekdayFormatter,
} from './utils';

type BatchFormProps = {
    show: boolean;
    onClose: () => void;
    data: BatchModel;
};

function BatchForm(props: BatchFormProps) {
    const [activeDateField, setActiveDateField] =
        useState<EditableDateField>('start_date');
    const { item, errors, setItem, handleChange, setErrors } = useHandleChange({
        id: props.data?.id || 0,
        batch_name: props.data?.batch_name || '',
        year: props.data?.year || '',
        quarter: props.data?.quarter || '',
        batch_description: props.data?.batch_description || '',
        content_source: props.data?.content_source || '',
        start_date: normalizeDateValue(props.data?.start_date),
        target_shortlist_date: normalizeDateValue(
            props.data?.target_shortlist_date,
        ),
        target_initial_review_date: normalizeDateValue(
            props.data?.target_initial_review_date,
        ),
        target_quality_approval_date: normalizeDateValue(
            props.data?.target_quality_approval_date,
        ),
        target_published_date: normalizeDateValue(
            props.data?.target_published_date,
        ),
        is_dost: props.data?.is_dost || false,
    });
    const schedulePreview = useMemo(
        () =>
            buildSchedulePreview(
                String(item.start_date),
                Boolean(item.is_dost),
                {
                    start_date: String(item.start_date),
                    target_shortlist_date: String(item.target_shortlist_date),
                    target_initial_review_date: String(
                        item.target_initial_review_date,
                    ),
                    target_quality_approval_date: String(
                        item.target_quality_approval_date,
                    ),
                    target_published_date: String(item.target_published_date),
                },
            ),
        [
            item.is_dost,
            item.start_date,
            item.target_initial_review_date,
            item.target_published_date,
            item.target_quality_approval_date,
            item.target_shortlist_date,
        ],
    );
    const activeMilestone = schedulePreview?.milestones.find(
        (milestone) => milestone.key === activeDateField,
    );
    const selectedCalendarDate =
        activeMilestone?.date ?? parseDateInput(String(item.start_date));
    const calendarMonth =
        selectedCalendarDate ?? schedulePreview?.milestones[0]?.date;

    const createFormData = (): FormData => {
        const formData = new FormData();
        formData.append('batch_name', item.batch_name);
        formData.append('content_source', item.content_source);
        formData.append('batch_description', item.batch_description);
        formData.append('start_date', item.start_date);
        formData.append('year', item.year);
        formData.append('quarter', item.quarter);
        formData.append('is_dost', item.is_dost ? '1' : '0');
        formData.append('target_shortlist_date', item.target_shortlist_date);
        formData.append(
            'target_initial_review_date',
            item.target_initial_review_date,
        );
        formData.append(
            'target_quality_approval_date',
            item.target_quality_approval_date,
        );
        formData.append('target_published_date', item.target_published_date);
        return formData;
    };

    const createBatch = useCreateBatch();
    const createBatchFn = (): void => {
        const formData = createFormData();
        createBatch.mutate(formData, {
            onSuccess: () => {
                clearFields();
                toast.success('Batch Successfully Created');
                props.onClose();
            },
            onError: (err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    toast.error('Check input fields for errors');
                }
            },
        });
    };

    const updateBatch = useUpdateBatch();
    const updateBatchFn = (): void => {
        const formData = createFormData();
        updateBatch.mutate(
            { id: item.id, payload: formData },
            {
                onSuccess: () => {
                    clearFields();
                    toast.success('Batch Successfully Updated');
                    props.onClose();
                },
                onError: (err) => {
                    if (err.response?.data?.errors) {
                        setErrors(err.response.data.errors);
                        toast.error('Check input fields for errors');
                    }
                },
            },
        );
    };

    const clearFields = useCallback(() => {
        setItem({
            id: 0,
            batch_name: '',
            batch_description: '',
            content_source: '',
            year: '',
            quarter: '',
            start_date: '',
            target_shortlist_date: '',
            target_initial_review_date: '',
            target_quality_approval_date: '',
            target_published_date: '',
            is_dost: false,
        });
        setErrors({});
        setActiveDateField('start_date');
    }, [setItem, setErrors]);

    const handleCalendarSelect = useCallback(
        (date: Date | undefined): void => {
            if (!date) {
                return;
            }

            const formattedDate = formatDateInput(date);

            setItem((prev) => ({
                ...prev,
                [activeDateField]: formattedDate,
            }));
            setErrors((prev) => ({ ...prev, [activeDateField]: '' }));
        },
        [activeDateField, setErrors, setItem],
    );

    const handleMilestoneEditorSelect = useCallback(
        (field: EditableDateField): void => {
            setActiveDateField(field);
        },
        [],
    );

    const clearMilestoneOverride = useCallback(
        (field: EditableDateField): void => {
            if (field === 'start_date') {
                return;
            }

            setItem((prev) => ({
                ...prev,
                [field]: '',
            }));
        },
        [setItem],
    );

    useEffect(() => {
        if (props.data?.id === 0) {
            clearFields();
        } else if (props.data) {
            setItem({
                id: props.data.id as number,
                batch_name: props.data.batch_name,
                batch_description: props.data.batch_description,
                content_source: props.data.content_source,
                year: props.data.year as string,
                quarter: props.data.quarter as string,
                start_date: normalizeDateValue(props.data.start_date),
                target_shortlist_date: normalizeDateValue(
                    props.data.target_shortlist_date,
                ),
                target_initial_review_date: normalizeDateValue(
                    props.data.target_initial_review_date,
                ),
                target_quality_approval_date: normalizeDateValue(
                    props.data.target_quality_approval_date,
                ),
                target_published_date: normalizeDateValue(
                    props.data.target_published_date,
                ),
                is_dost: props.data.is_dost as boolean,
            });
            setActiveDateField('start_date');
        }
    }, [props.data, setItem, clearFields]);

    useEffect(() => {
        if (item.is_dost && activeDateField === 'target_initial_review_date') {
            setActiveDateField('start_date');
        }
    }, [activeDateField, item.is_dost]);

    const years = generateYears();

    return (
        <Dialog open={props.show} onOpenChange={() => {}}>
            <DialogContent
                className={`max-h-[92vh] max-w-[96vw] overflow-y-auto border-sky-100 bg-white p-6 text-gray-600 shadow-2xl sm:p-8 xl:p-10 ${
                    schedulePreview
                        ? 'w-[96vw] min-w-425 xl:max-w-450'
                        : 'w-fit min-w-150'
                }`}
            >
                <DialogHeader className="space-y-2 border-b border-slate-100 pb-5">
                    <DialogTitle className="poppins-bold text-center text-2xl text-sky-600 sm:text-left">
                        {props.data?.id === 0 ? 'Add' : 'Edit'} Batch Form{' '}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-500 sm:text-left">
                        Review the batch details on the left, then fine-tune the
                        schedule workspace on the right.
                    </DialogDescription>
                </DialogHeader>
                <div
                    className={`w-full gap-6 pt-2 xl:items-start ${
                        schedulePreview
                            ? 'xl:grid xl:grid-cols-[320px_minmax(0,1fr)]'
                            : 'flex flex-col'
                    }`}
                >
                    <div
                        className={`flex w-full flex-col gap-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm ${
                            schedulePreview ? 'xl:max-w-[320px]' : ''
                        }`}
                    >
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-800">
                                Batch Details
                            </h3>
                            <p className="text-xs leading-5 text-slate-500">
                                Keep the core metadata tidy here before
                                adjusting deadlines.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid gap-1">
                                <Label
                                    htmlFor="batch_id"
                                    className="poppins-semibold text-[13px] text-gray-600"
                                >
                                    Quarter{' '}
                                </Label>
                                <Select
                                    value={String(item.quarter)}
                                    onValueChange={(value) => {
                                        setErrors((prev) => ({
                                            ...prev,
                                            quarter: '',
                                        }));
                                        setItem((prev) => ({
                                            ...prev,
                                            quarter: value,
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-11 border-sky-200 bg-white shadow-none">
                                        <SelectValue
                                            placeholder=""
                                            className="text-[12px]"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quarters.map((type, index) => (
                                            <SelectItem
                                                key={index}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <InputError message={errors.quarter} />
                            </div>
                            <div className="grid gap-1">
                                <Label
                                    htmlFor="batch_id"
                                    className="poppins-semibold text-[13px] text-gray-600"
                                >
                                    Year{' '}
                                </Label>
                                <Select
                                    value={String(item.year)}
                                    onValueChange={(value) => {
                                        setErrors((prev) => ({
                                            ...prev,
                                            year: '',
                                        }));
                                        setItem((prev) => ({
                                            ...prev,
                                            year: value,
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-11 border-sky-200 bg-white shadow-none">
                                        <SelectValue
                                            placeholder=""
                                            className="text-[12px]"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((type, index) => (
                                            <SelectItem
                                                key={index}
                                                value={String(type)}
                                            >
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <InputError message={errors.year} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="content_source"
                                className="text-gray-600"
                            >
                                Content Source
                            </Label>
                            <Input
                                id="content_source"
                                type="text"
                                name="content_source"
                                required
                                onChange={handleChange}
                                value={String(item.content_source)}
                                className="h-11 border-sky-200 bg-white text-gray-600 shadow-none"
                            />
                            <InputError
                                message={errors.content_source as string}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="start_date"
                                className="text-gray-600"
                            >
                                Start Date
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                name="start_date"
                                required
                                onChange={handleChange}
                                value={String(item.start_date)}
                                className="h-11 border-sky-200 bg-white text-gray-600 shadow-none"
                            />
                            <InputError message={errors.start_date as string} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor="batch_description"
                                className="text-gray-600"
                            >
                                Description
                            </Label>
                            <Textarea
                                id="batch_description"
                                name="batch_description"
                                required
                                onChange={handleChange}
                                value={String(item.batch_description)}
                                className="min-h-32 border-sky-200 bg-white text-gray-600 shadow-none"
                            />
                            <InputError
                                message={errors.batch_description as string}
                            />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <label
                                htmlFor="showPassword"
                                className="flex cursor-pointer items-start gap-3"
                            >
                                <Checkbox
                                    id="showPassword"
                                    checked={Boolean(item.is_dost)}
                                    onCheckedChange={(checked: boolean) =>
                                        setItem((prev) => ({
                                            ...prev,
                                            is_dost: checked,
                                        }))
                                    }
                                    className="mt-0.5 size-5 rounded-md border-slate-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-500"
                                />
                                <div className="space-y-1">
                                    <span className="block text-sm font-semibold text-slate-700">
                                        DOST Agency
                                    </span>
                                    <span className="block text-xs leading-5 text-slate-500">
                                        Apply the accelerated schedule when this
                                        batch is under DOST.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="w-full min-w-0 flex-1">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                            {schedulePreview && (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-semibold text-slate-800">
                                                Schedule Workspace
                                            </h3>
                                            <p className="text-xs leading-5 text-slate-500">
                                                Select a milestone card, then
                                                use the calendar to update that
                                                specific date.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500">
                                                Editing:
                                            </span>
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                                {activeMilestone?.label ??
                                                    'Start Date'}
                                            </span>
                                            {activeMilestone?.isOverride &&
                                            activeDateField !== 'start_date' ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                                    onClick={() =>
                                                        clearMilestoneOverride(
                                                            activeDateField,
                                                        )
                                                    }
                                                >
                                                    Reset override
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="w-full xl:grid xl:grid-cols-[minmax(340px,380px)_minmax(0,1fr)] xl:gap-4">
                                        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white p-6">
                                            <DayPicker
                                                mode="single"
                                                month={calendarMonth}
                                                selected={
                                                    selectedCalendarDate as Date
                                                }
                                                onSelect={handleCalendarSelect}
                                                showOutsideDays
                                                className="mx-auto w-full"
                                                modifiers={{
                                                    shortlist:
                                                        schedulePreview.milestones
                                                            .filter(
                                                                (milestone) =>
                                                                    milestone.key ===
                                                                    'target_shortlist_date',
                                                            )
                                                            .map(
                                                                (milestone) =>
                                                                    milestone.date,
                                                            ),
                                                    initialReview:
                                                        schedulePreview.milestones
                                                            .filter(
                                                                (milestone) =>
                                                                    milestone.key ===
                                                                    'target_initial_review_date',
                                                            )
                                                            .map(
                                                                (milestone) =>
                                                                    milestone.date,
                                                            ),
                                                    qualityApproval:
                                                        schedulePreview.milestones
                                                            .filter(
                                                                (milestone) =>
                                                                    milestone.key ===
                                                                    'target_quality_approval_date',
                                                            )
                                                            .map(
                                                                (milestone) =>
                                                                    milestone.date,
                                                            ),
                                                    published:
                                                        schedulePreview.milestones
                                                            .filter(
                                                                (milestone) =>
                                                                    milestone.key ===
                                                                    'target_published_date',
                                                            )
                                                            .map(
                                                                (milestone) =>
                                                                    milestone.date,
                                                            ),
                                                }}
                                                modifiersStyles={{
                                                    shortlist: {
                                                        backgroundColor:
                                                            '#d1fae5',
                                                        color: '#047857',
                                                        fontWeight: '600',
                                                    },
                                                    initialReview: {
                                                        backgroundColor:
                                                            '#fef3c7',
                                                        color: '#b45309',
                                                        fontWeight: '600',
                                                    },
                                                    qualityApproval: {
                                                        backgroundColor:
                                                            '#ede9fe',
                                                        color: '#6d28d9',
                                                        fontWeight: '600',
                                                    },
                                                    published: {
                                                        backgroundColor:
                                                            '#cffafe',
                                                        color: '#0f766e',
                                                        fontWeight: '600',
                                                    },
                                                }}
                                            />
                                        </div>
                                        <div className="mt-4 grid w-full gap-3 sm:grid-cols-2 xl:mt-0">
                                            {schedulePreview.milestones.map(
                                                (milestone) => (
                                                    <button
                                                        key={milestone.key}
                                                        type="button"
                                                        onClick={() =>
                                                            handleMilestoneEditorSelect(
                                                                milestone.key,
                                                            )
                                                        }
                                                        className={`w-full rounded-xl border px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${milestone.accentClassName} ${
                                                            activeDateField ===
                                                            milestone.key
                                                                ? 'ring-2 ring-sky-200'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="inline-flex size-2.5 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            milestone.fillColor,
                                                                    }}
                                                                />
                                                                <span className="text-sm font-semibold">
                                                                    {
                                                                        milestone.label
                                                                    }
                                                                </span>
                                                                {milestone.isOverride &&
                                                                milestone.key !==
                                                                    'start_date' ? (
                                                                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
                                                                        Manual
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <PencilLine className="size-4" />
                                                        </div>
                                                        <div className="mt-2 text-sm font-semibold">
                                                            {fullDateFormatter.format(
                                                                milestone.date,
                                                            )}
                                                        </div>
                                                        <div className="text-xs opacity-80">
                                                            {weekdayFormatter.format(
                                                                milestone.date,
                                                            )}
                                                        </div>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!schedulePreview && (
                                <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
                                    <div className="space-y-2">
                                        <h3 className="text-base font-semibold text-slate-700">
                                            Schedule Preview
                                        </h3>
                                        <p className="text-sm leading-6 text-slate-500">
                                            Add a start date to open the
                                            calendar workspace and generated
                                            milestone cards.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex w-full flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                    <Button
                        className="border bg-gray-50 text-sm text-gray-800"
                        onClick={props.onClose}
                    >
                        Close
                    </Button>
                    <Button
                        className="bg-sky-600"
                        onClick={() =>
                            props.data?.id === 0
                                ? createBatchFn()
                                : updateBatchFn()
                        }
                        disabled={
                            createBatch.isPending || updateBatch.isPending
                        }
                    >
                        {createBatch.isPending || updateBatch.isPending
                            ? 'Saving...'
                            : props.data?.id === 0
                              ? 'Add'
                              : 'Update'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default memo(BatchForm);
