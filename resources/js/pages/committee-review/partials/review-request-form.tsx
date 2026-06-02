import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/text-area';
import { useHandleChange } from '@/hooks/use-handle-change';
import type { BreadcrumbItem } from '@/types';
import type { ApprovalRequestModel, BatchModel } from '@/types/model';
import ContentViewer from '@/components/custom/content/content-viewer';
import { useState } from 'react';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

const disapprovalReasons = ['Accuracy', 'Authority/Credibility', 'Coverage and Relevance', 'Purpose and Objectivity', 'Recency'];

type ReviewDecision = 'approved' | 'disapproved' | '';

type ReviewFormValues = {
  review_decision: ReviewDecision;
  disapproval_reasons: string[];
  remarks: string;
};

type ReviewRequestPageProps = {
  approval_request?: ApprovalRequestModel & {
    batch?: BatchModel;
  };
  batch?: BatchModel;
};

export default function ReviewRequestForm() {
  const { props } = usePage<ReviewRequestPageProps>();
  const batch = props.batch;
  const [open, setOpen] = useState(false);
  const holdingsID = props.approval_request?.HoldingsID ?? '';
  const request = props.approval_request;
  const { item, handleChange, handleArrayChange, setItem } = useHandleChange<ReviewFormValues>({
    review_decision: '',
    disapproval_reasons: [],
    remarks: '',
  });
  const isDisapproved = item.review_decision === 'disapproved';

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Committee Review Batches',
      href: '/view-committee-review-batches',
    },
    {
      title: `${batch?.batch_name}`,
      href: batch
        ? `/view-committee-review-batch/${batch.batch_name}`
        : '/view-committee-review-batches',
    },
    {
      title: 'Review Request Form',
      href: `/committee-review-request/${holdingsID}`,
    },
  ];

  const handleReviewDecisionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    handleChange(event);
    if (event.target.value === 'approved') {
      setItem((currentItem) => ({
        ...currentItem,
        disapproval_reasons: [],
      }));
    }
  };

  const handleReasonChange = (reason: string): void => {
    const selectedReasons = item.disapproval_reasons.includes(reason)
      ? item.disapproval_reasons.filter((selectedReason) => selectedReason !== reason)
      : [...item.disapproval_reasons, reason];

    handleArrayChange('disapproval_reasons', selectedReasons);
  };

  const handleSubmit = (): void => {

    console.log('doje')
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-4 flex flex-row gap-4">
        <section className="relative overflow-hidden rounded-2xl border border-sky-200 bg-white text-gray-500 shadow-sm p-6">
          {request ? (
            <ContentViewer fields={request} />
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
              Select a record to preview its content.
            </div>
          )}
        </section>
        <section className="relative h-fit w-220 overflow-hidden rounded-2xl border border-sky-200 bg-white text-gray-700 shadow-sm">
          <div className='p-6 space-y-2'>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">Committee Review</h2>
            </div>

            <div className="grid gap-3">
              {[
                { value: 'approved', label: 'Approve', description: 'Content is ready to move forward.' },
                { value: 'disapproved', label: 'Disapprove', description: 'Content needs review notes before moving forward.' },
              ].map((option) => {
                const isSelected = item.review_decision === option.value;

                return (
                  <Label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${isSelected
                        ? 'border-sky-400 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="review_decision"
                      value={option.value}
                      checked={isSelected}
                      onChange={handleReviewDecisionChange}
                      className="mt-1 size-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs leading-5 text-slate-500">{option.description}</span>
                    </span>
                  </Label>
                );
              })}
            </div>

            {isDisapproved ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h1 className="text-sm font-medium text-slate-800 mb-2">Disapproval reasons</h1>
                <div className="grid gap-2">
                  {disapprovalReasons.map((reason) => (
                    <Label
                      key={reason}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-sky-200"
                    >
                      <input
                        type="checkbox"
                        checked={item.disapproval_reasons.includes(reason)}
                        onChange={() => handleReasonChange(reason)}
                        className="size-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{reason}</span>
                    </Label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-medium text-slate-800">
                Remarks
              </Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={String(item.remarks)}
                onChange={handleChange}
                placeholder="Add committee remarks"
                className="min-h-32 resize-none border-slate-200 text-sm focus-visible:ring-sky-500"
              />
            </div>

            <Button className="w-full bg-sky-600 text-white hover:bg-sky-700">
              Submit review
            </Button>
          </div>
        </section>
      </div>
      <ConfirmationDialog show={open} type={1} onClose={() => setOpen(false)} message="Are you sure yow want to submit this review?" onConfirm={handleSubmit} />
    </AppLayout>
  );
}
