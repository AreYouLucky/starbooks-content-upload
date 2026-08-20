import { ReactNode, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Eye, FileScan, RefreshCw, Search, ShieldX } from 'lucide-react';
import { trimText, purifyDom } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { RequestModel } from '@/types/model';
import ViewContent from '@/components/custom/view-content';
import ImageLoader from '@/components/custom/image-loader';
import { isSinglePdfGroup, normalizeGroup } from '@/components/custom/content/utils/utils';

type StatusMeta = {
  label: string;
  className: string;
};

type RequestAnalytics = {
  pending: number;
  approved: number;
  disapproved: number;
};

type RequestFilters = {
  quarter: string;
  year: string;
  search: string;
};

type PaginatedApprovalRequests = {
  data: RequestModel[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  total: number;
  per_page: number;
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

const getApprovalStatusMeta = (status: RequestModel['approval_status']): StatusMeta => {
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
    title: 'Initial Review Requests',
    href: '/initial-review-page',
  },
];

export default function RequestList() {
  const { props } = usePage<{
    approval_requests?: PaginatedApprovalRequests;
    filters?: RequestFilters;
    quarters?: string[];
    years?: string[];
    analytics?: RequestAnalytics;
  }>();

  const approvalRequests = props.approval_requests?.data ?? [];
  const analytics = props.analytics ?? { pending: 0, approved: 0, disapproved: 0 };
  const quarters = props.quarters ?? [];
  const years = props.years ?? [];
  const [filters, setFilters] = useState<RequestFilters>(props.filters ?? {
    quarter: 'all',
    year: 'all',
    search: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewContentDialogOpen, setViewContentDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<RequestModel | null>(null);

  const applyFilters = (nextFilters: RequestFilters): void => {
    setFilters(nextFilters);
    router.get('/initial-review-page', nextFilters, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const changeFilter = <K extends keyof RequestFilters>(key: K, value: RequestFilters[K]): void => {
    applyFilters({ ...filters, [key]: value });
  };

  const changePage = (url: string | null): void => {
    if (!url) {
      return;
    }

    router.visit(url, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const refreshRequests = (): void => {
    router.reload({
      only: ['approval_requests', 'analytics', 'quarters', 'years'],
      onStart: () => setIsRefreshing(true),
      onFinish: () => setIsRefreshing(false),
    });
  };

  const viewContent = (request: RequestModel) => {
    setSelectedContent(request);
    setViewContentDialogOpen(true);
  }

  const processImage = (request: RequestModel): string => {
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
      <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500 p-5 py-6 text-gray-50 shadow-sm md:px-8">
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="space-y-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight uppercase md:text-2xl">
                    Initial Review Requests
                  </h1>
                  <p className="text-sm">
                    Review and track the content requests assigned to you.
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
        <CardContent className="p-4">
          <div className="mb-4 flex w-full flex-col gap-3 py-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:w-72">
              <div className="relative">
                <Search className="absolute top-3.5 left-3 size-4 text-sky-500" />
                <Input
                  value={filters.search}
                  placeholder="Search requests"
                  className="border-sky-200 bg-white ps-9 text-slate-700"
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyFilters(filters);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="w-full sm:w-48">
                <Select value={filters.quarter} onValueChange={(value) => changeFilter('quarter', value)}>
                  <SelectTrigger aria-label="Filter by quarter" className="text-gray-500">
                    <SelectValue placeholder="All quarters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All quarters</SelectItem>
                    {quarters.map((quarter) => <SelectItem key={quarter} value={quarter}>{quarter}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <Select value={filters.year} onValueChange={(value) => changeFilter('year', value)}>
                  <SelectTrigger aria-label="Filter by year" className="text-gray-500">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={refreshRequests}
                disabled={isRefreshing}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <PaginatedSearchTable<RequestModel>
            items={approvalRequests}
            headers={[
              { name: 'Holdings ID', position: 'left' },
              { name: 'Thumbnail', position: 'center' },
              { name: 'Title & Author', position: 'left' },
              { name: 'Abstract', position: 'left' },
              { name: 'Status', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
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
                      {
                        request.approval_status === 1 && (
                          <Link
                            href={`/initial-review-request/${request.HoldingsID}`}
                            className="flex flex-row font-semiboldflex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm text-sky-50 hover:bg-sky-600"
                          >
                            <FileScan className="size-4" /> Review
                          </Link>
                        )
                      }
                      <Button className='' onClick={() => viewContent(request)} ><Eye className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            }}
            itemsPerPage={props.approval_requests?.per_page ?? 10}
            emptyText="No assigned requests found."
            currentPage={props.approval_requests?.current_page}
            totalPages={props.approval_requests?.last_page}
            nextPageUrl={props.approval_requests?.next_page_url}
            prevPageUrl={props.approval_requests?.prev_page_url}
            total={props.approval_requests?.total}
            onPageChange={changePage}
          />
        </CardContent>
      </Card>
      <ViewContent show={viewContentDialogOpen} onClose={() => setViewContentDialogOpen(false)} data={selectedContent as RequestModel} />
    </div>
  );
}

RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
