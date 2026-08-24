import type { ChangeEvent, JSX } from 'react';
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import ContentViewer from '@/components/custom/content/content-viewer';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/text-area';
import { useHandleChange } from '@/hooks/use-handle-change';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel } from '@/types/model';
import {
    getQualityAssuranceErrorMessage,
    type QualityAssuranceValidationErrors,
    useSubmitQualityAssuranceReview,
} from './quality-assurance-hooks';

type ReviewDecision = 'approved' | 'disapproved' | '';
type ReviewFormValues = {
    review_decision: ReviewDecision;
    disapproval_reasons: string[];
    remarks: string;
};
type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>;
type PageProps = {
    approval_request?: RequestModel;
};

const disapprovalReasons = [
    'Completeness',
    'Readability',
    'Clarity',
    'Quality',
];

function mapValidationErrors(
    errors: QualityAssuranceValidationErrors,
): ReviewFormErrors {
    return {
        review_decision: errors.review_decision?.[0],
        disapproval_reasons:
            errors.disapproval_reasons?.[0] ??
            Object.entries(errors).find(([key]) =>
                key.startsWith('disapproval_reasons.'),
            )?.[1][0],
        remarks: errors.remarks?.[0],
    };
}

export default function QualityAssuranceReviewForm(): JSX.Element {
    const { props } = usePage<PageProps>();
    const request = props.approval_request;
    const holdingsID = request?.HoldingsID ?? '';
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const {
        item,
        errors,
        handleChange,
        handleArrayChange,
        setItem,
        setErrors,
    } = useHandleChange<ReviewFormValues>({
        review_decision: '',
        disapproval_reasons: [],
        remarks: '',
    });
    const submitReview = useSubmitQualityAssuranceReview();
    const isDisapproved = item.review_decision === 'disapproved';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        {
            title: 'Quality Assurance Requests',
            href: '/quality-assurance-page',
        },
        {
            title: 'Review Request',
            href: `/quality-assurance-request/${holdingsID}`,
        },
    ];

    const handleDecisionChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        handleChange(event);
        if (event.target.value === 'approved') {
            setItem((current) => ({ ...current, disapproval_reasons: [] }));
            setErrors((current) => ({
                ...current,
                disapproval_reasons: undefined,
            }));
        }
    };

    const validateReviewForm = (): boolean => {
        const nextErrors: ReviewFormErrors = {};

        if (!item.review_decision) {
            nextErrors.review_decision = 'Select a review decision.';
        }

        if (isDisapproved && item.disapproval_reasons.length === 0) {
            nextErrors.disapproval_reasons =
                'Select at least one disapproval reason.';
        }

        if (isDisapproved && item.remarks.trim() === '') {
            nextErrors.remarks =
                'Remarks are required for disapproved decisions.';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleConfirm = (): void => {
        if (validateReviewForm()) {
            setIsConfirmationOpen(true);
        }
    };

    const handleSubmit = (): void => {
        if (!validateReviewForm()) {
            setIsConfirmationOpen(false);
            return;
        }

        const formData = new FormData();
        formData.append('holdings_id', holdingsID);
        formData.append('review_decision', item.review_decision);
        formData.append('remarks', item.remarks);
        item.disapproval_reasons.forEach((reason) =>
            formData.append('disapproval_reasons[]', reason),
        );

        submitReview.mutate(formData, {
            onSuccess: (response) => {
                setIsConfirmationOpen(false);
                toast.success(response.message);
                router.visit('/quality-assurance-page');
            },
            onError: (error) => {
                setIsConfirmationOpen(false);
                if (error.response?.data?.errors) {
                    setErrors(mapValidationErrors(error.response.data.errors));
                    toast.error('Check the review fields for errors.');
                    return;
                }
                toast.error(getQualityAssuranceErrorMessage(error));
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="grid grid-cols-4 gap-4">
                <section className="col-span-3 min-w-0 flex-1 rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
                    {request ? (
                        <ContentViewer fields={request} />
                    ) : (
                        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
                            Content is unavailable.
                        </div>
                    )}
                </section>
                <section className="h-fit w-full rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">
                        Quality Assurance Review
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Record the final quality decision for this content.
                    </p>

                    <div className="mt-5 grid gap-3">
                        {[
                            {
                                value: 'approved',
                                label: 'Approve',
                                description: 'Content is ready for publishing.',
                            },
                            {
                                value: 'disapproved',
                                label: 'Disapprove',
                                description:
                                    'Content requires correction before publishing.',
                            },
                        ].map((option) => (
                            <Label
                                key={option.value}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${item.review_decision === option.value ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-200'}`}
                            >
                                <input
                                    type="radio"
                                    name="review_decision"
                                    value={option.value}
                                    checked={
                                        item.review_decision === option.value
                                    }
                                    onChange={handleDecisionChange}
                                    className="mt-1 size-4 text-sky-600 focus:ring-sky-500"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        {option.label}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                                        {option.description}
                                    </span>
                                </span>
                            </Label>
                        ))}
                        <InputError message={errors.review_decision} />
                    </div>

                    {isDisapproved ? (
                        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-800">
                                Disapproval reasons
                            </p>
                            {disapprovalReasons.map((reason) => (
                                <Label
                                    key={reason}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.disapproval_reasons.includes(
                                            reason,
                                        )}
                                        onChange={() =>
                                            handleArrayChange(
                                                'disapproval_reasons',
                                                item.disapproval_reasons.includes(
                                                    reason,
                                                )
                                                    ? item.disapproval_reasons.filter(
                                                          (itemReason) =>
                                                              itemReason !==
                                                              reason,
                                                      )
                                                    : [
                                                          ...item.disapproval_reasons,
                                                          reason,
                                                      ],
                                            )
                                        }
                                        className="size-4 rounded text-sky-600 focus:ring-sky-500"
                                    />
                                    {reason}
                                </Label>
                            ))}
                            <InputError message={errors.disapproval_reasons} />
                        </div>
                    ) : null}

                    <div className="mt-4 space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                            id="remarks"
                            name="remarks"
                            value={item.remarks}
                            onChange={handleChange}
                            placeholder="Add quality assurance remarks"
                            className="min-h-32 resize-none"
                        />
                        <InputError message={errors.remarks} />
                    </div>

                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitReview.isPending}
                        className="mt-5 w-full bg-sky-600 text-white hover:bg-sky-700"
                    >
                        {submitReview.isPending
                            ? 'Submitting...'
                            : 'Submit review'}
                    </Button>
                </section>
            </div>

            <ConfirmationDialog
                show={isConfirmationOpen}
                type={2}
                onClose={() => setIsConfirmationOpen(false)}
                message="Are you sure you want to submit this quality assurance review?"
                onConfirm={handleSubmit}
            />
        </AppLayout>
    );
}
