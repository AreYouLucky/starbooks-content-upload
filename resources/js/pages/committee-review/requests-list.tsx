import { ReactNode, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Eye, ShieldX,FileScan} from 'lucide-react';
import { trimText, purifyDom } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table';
import type { BreadcrumbItem } from '@/types';
import { ApprovalRequestModel, BatchModel } from '@/types/model';
import ViewContent from '@/components/custom/view-content';
import ImageLoader from '@/components/custom/image-loader';
import { isSinglePdfGroup, normalizeGroup } from '@/components/custom/content/utils/utils';
import { Link } from '@inertiajs/react';

type StatusMeta = {
  label: string;
  className: string;
};

type RequestAnalytics = {
  pending: number;
  approved: number;
  disapproved: number;
};

const statusSummaryItems = [
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock3,
    tone: 'border-sky-100 bg-blue-50/90 text-sky-700',
    iconTone: 'text-sky-500',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: CheckCircle2,
    tone: 'border-emerald-100 bg-green-50/90 text-emerald-700',
    iconTone: 'text-emerald-500',
  },
  {
    key: 'disapproved',
    label: 'Disapproved',
    icon: ShieldX,
    tone: 'border-rose-100 bg-red-50/90 text-rose-700',
    iconTone: 'text-rose-500',
  },
] as const;

const getApprovalStatusMeta = (status: ApprovalRequestModel['approval_status']): StatusMeta => {
  if (status === 1) {
    return {
      label: 'Pending',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }

  if (status === 2) {
    return {
      label: 'Approved',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (status === 3) {
    return {
      label: 'Disapproved',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  return {
    label: 'Unknown',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  };
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Committee Review Batches',
    href: '/committee-review-page',
  },
  {
    title: 'Requests List',
    href: '/shortlisted-page',
  },
];

export default function RequestList() {
  const { props } = usePage<{
    approval_requests?: ApprovalRequestModel[];
    batch?: BatchModel;
  }>();

  const approvalRequests = props.approval_requests ?? [];
  const analytics = approvalRequests.reduce<RequestAnalytics>(
    (counts, request) => {
      if (request.approval_status === 1) {
        return { ...counts, pending: counts.pending + 1 };
      }

      if (request.approval_status === 2) {
        return { ...counts, approved: counts.approved + 1 };
      }

      if (request.approval_status === 3) {
        return { ...counts, disapproved: counts.disapproved + 1 };
      }

      return counts;
    },
    { pending: 0, approved: 0, disapproved: 0 },
  );
  const batch = props.batch;
  const [viewContentDialogOpen, setViewContentDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ApprovalRequestModel | null>(null);

  const viewContent = (request: ApprovalRequestModel) => {
    setSelectedContent(request);
    setViewContentDialogOpen(true);
  }

  const processImage = (request: ApprovalRequestModel): string => {
    const normalizedContents = normalizeGroup(request.Contents);

    if (
      (request.Type === "1" && isSinglePdfGroup(request.Type, normalizedContents)) ||
      ["3", "5", "7"].includes(request.Type as string)
    ) {
      return `/assets/images/thumbs/${request.HoldingsID}.png`;
    }

    if (request.Type === "2") {
      return `/assets/fullvideo/thumbs/${request.HoldingsID}.png`;
    }

    return "/storage/logos/fulltext_thumbnail.png";
  };

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-sky-100 text-gray-50  p-5 shadow-sm md:px-8 py-6 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500">
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="space-y-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight  md:text-2xl uppercase">
                    {batch?.batch_name ?? 'Shortlisting Requests'}
                  </h1>
                  <p className="text-sm ">
                    {batch?.batch_description ?? 'Batch Description'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusSummaryItems.map(({ key, label, icon: Icon, tone, iconTone }) => (
                <div
                  key={key}
                  className={`min-w-34 rounded-lg border px-3 py-2  ${tone}`}
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    <Icon className={`size-3.5 ${iconTone}`} />
                    {label}
                  </div>
                  <p className="mt-1 text-2xl font-bold leading-none">
                    {analytics[key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Card className="gap-0 rounded-2xl border-sky-200 py-0 shadow-sm">
        <CardContent className=" p-2">
          <PaginatedSearchTable<ApprovalRequestModel>
            items={approvalRequests}
            headers={[
              { name: 'Holdings ID', position: 'left' },
              { name: 'Thumbnail', position: 'center' },
              { name: 'Title & Author', position: 'left' },
              { name: 'Abstract', position: 'left' },
              { name: 'Status', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
            searchBy={(item) =>
              `${item.Title ?? ''} ${item.Abstracts ?? ''} ${item.Author ?? ''} ${item.HoldingsID ?? ''}`
            }
            renderRow={(request) => {
              const statusMeta = getApprovalStatusMeta(request.approval_status);

              return (
                <tr key={request.id ?? request.HoldingsID} className="border-b border-gray-100 bg-white transition hover:bg-gray-100/40">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{request.HoldingsID || 'N/A'}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {request.MaterialType || 'Unspecified Type'}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className='flex justify-center'>
                      <ImageLoader
                        src={processImage(request)}
                        alt="Program Banner"
                        className="h-18 w-auto my-1 rounded"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{request.Title || 'Untitled request'}</p>
                      <p className="text-sm text-slate-500">{request.Author || 'Unknown author'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="max-w-2xl text-sm leading-6 text-slate-600 text-justify">
                      {request.Abstracts !== '' ?
                        <div
                          className="p-2 text-justify"
                          dangerouslySetInnerHTML={{
                            __html: purifyDom(trimText(String(request?.Abstracts), 220) ?? ""),
                          }}
                        /> : 'Not Set'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-middle ">
                    <div className='flex justify-center items-center w-full gap-1'>
                      <Link href={`/committee-review-request/${request.HoldingsID}`} className='flex flex-row font-semiboldflex items-center gap-2 text-sky-50 bg-sky-600 hover:bg-sky-600 px-3 py-2 rounded-md text-sm'><FileScan className="size-4" /> Review</Link>
                      <Button className='' onClick={() => viewContent(request)} ><Eye className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            }}
            itemsPerPage={5}
            searchPlaceholder="Search Requests"
            emptyText="No requests found for this batch."
          />
        </CardContent>
      </Card>
      <ViewContent show={viewContentDialogOpen} onClose={() => setViewContentDialogOpen(false)} data={selectedContent as ApprovalRequestModel} />
    </div>
  );
}

RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
