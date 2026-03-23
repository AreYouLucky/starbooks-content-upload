import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { useHandleChange } from '@/hooks/use-handle-change';
import BatchForm from './partials/batch-form';
import { CalendarDays, CircleCheckBig, FileClock, FolderSync, PencilLine, TextSearch, Plus, BookOpenCheck, Search } from 'lucide-react';
import { type ReactNode, use, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import type { BatchModel } from '@/types/model';
import { useFetchBatches, useToggleBatchShortlist } from './partials/batches-hooks';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Batches',
    href: '/view-batches',
  },
];


export default function ViewBatches() {
  const [page, setPage] = useState(1);

  const onFilterChange = () => {
    setPage(1);
  };

  const [batchDialog, setBatchDialog] = useState(false);
  const { item, setItem } = useHandleChange({
    search: '',
  });
  const [batch, setBatch] = useState<BatchModel>({
    id: 0,
    batch_name: '',
    batch_description: '',
    target_published_date: new Date().toISOString().split('T')[0],
    content_source: '',
  });
  const debouncedTitle = useDebounce(item.search, 1000);
  const queryFilters = {
    ...item,
    title: debouncedTitle,
  };
  const { data, isFetching, refetch } = useFetchBatches(page, queryFilters);
  const batches = data?.data ?? [];

  const getStatusColor = (target?: string, actual?: string) => {
    if (!actual) return "text-gray-400"; // not done

    const t = new Date(target as string);
    const a = new Date(actual);

    return a > t ? "text-red-500" : "text-green-500";
  };

  const displayDate = (date?: string) => {
    return date ? formatDate(date) : "NA";
  };
  const stats = [
    {
      label: 'For Shortlisting',
      value: batches.filter((batch) => batch.status === 'for shortlisting').length,
      icon: FileClock,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'For Committee Review',
      value: batches.filter((batch) => batch.status === 'committee approval').length,
      icon: FileClock,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'For Quality Approval',
      value: batches.filter((batch) => batch.status === 'for quality approval').length,
      icon: TextSearch,
      tone: 'bg-sky-50 text-sky-500',
    },
    {
      label: 'Ready to publish',
      value: batches.filter((batch) => batch.status === 'for publishing').length,
      icon: CircleCheckBig,
      tone: 'bg-sky-50 text-sky-500',
    },
    {
      label: 'Published',
      value: batches.filter((batch) => batch.status === 'published').length,
      icon: BookOpenCheck,
      tone: 'bg-sky-50 text-sky-700',
    },
  ];

  const showUpdateDialog = (batch: BatchModel) => {
    setBatchDialog(true);
    setBatch(batch);
  }

  const toggleBatchShortlist = useToggleBatchShortlist();
  const toggleBatchShortlistFn = (id: number) => {
    toggleBatchShortlist.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err) => {
        console.log(err);
      },
    });
  }

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-xl p-4 border border-sky-100 md:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-sky-500">
                Batch Management
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Track upload groups, review targets, and publication schedules in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-slate-300 bg-white/80 px-4 text-slate-700 hover:bg-slate-100"
              onClick={() => refetch()}
            >
              <FolderSync className="size-4" />
              Refresh
            </Button>
            <Button className="h-11 rounded-lg bg-sky-500 px-5 text-white hover:bg-sky-600 flex gap-2" onClick={() => setBatchDialog(true)}>
              <Plus className="size-4" />
              New batch
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="gap-0 rounded-xl border-sky-100 py-0 ">
              <CardContent className="flex items-center justify-between px-9 py-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.tone}`}>
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="gap-0 rounded-xl border-sky-100 py-0 ">
        <div className="flex flex-col gap-3 border-b border-sky-100 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 relative">
            <Search className="absolute left-2.5 top-3 text-[#00aeef]" size={16} />
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Search Title"
              onChange={(e) => { setItem(prev => ({ ...prev, title: e.target.value })); onFilterChange() }}
              className="min-w-62.5 h-10 border-[#d1f3ff] shadow-none ps-8"
            />
          </div>

        </div>

        <CardContent className="p-4 sm:px-8">
          <PaginatedSearchTable<BatchModel>
            items={batches}
            headers={[
              { name: 'Batch', position: 'left' },
              { name: 'Source', position: 'left' },
              { name: 'Target Date', position: 'left' },
              { name: 'Date Accomplished', position: 'left' },
              { name: 'Status', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
            searchBy={(item) =>
              `${item.batch_name} ${item.content_source} ${item.batch_description}`
            }
            renderRow={(batch) => {

              return (
                <tr key={batch.id} className="border-b border-sky-100 bg-white transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">{batch.batch_name}</div>
                      <p className="max-w-md text-sm leading-6 text-slate-500 text-justify">
                        {batch.batch_description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="inline-flex rounded-full  px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {batch.content_source}
                    </div>

                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-cyan-500" />
                        Shortlist: {displayDate(batch.target_shortlist_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-cyan-500" />
                        IR: {displayDate(batch.target_initial_review_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-cyan-500" />
                        QA: {displayDate(batch.target_quality_approval_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-cyan-500" />
                        Publish: {displayDate(batch.target_published_date)}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center align-middle text-sm text-slate-700">
                    <div className="space-y-1 text-xs text-slate-600">

                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className={`size-4 ${getStatusColor(
                            batch.target_shortlist_date,
                            batch.shortlisted_date
                          )}`}
                        />
                        Shortlisted: {displayDate(batch.shortlisted_date)}
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className={`size-4 ${getStatusColor(
                            batch.target_initial_review_date,
                            batch.initial_reviewed_date
                          )}`}
                        />
                        IR: {displayDate(batch.initial_reviewed_date)}
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className={`size-4 ${getStatusColor(
                            batch.target_quality_approval_date,
                            batch.quality_approval_date
                          )}`}
                        />
                        QA: {displayDate(batch.quality_approval_date)}
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className={`size-4 ${getStatusColor(
                            batch.target_published_date,
                            batch.published_date
                          )}`}
                        />
                        Published: {displayDate(batch.published_date)}
                      </div>

                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <span className={`inline-flex rounded-full  bg-sky-50 uppercase text-sky-500 px-3 py-1 text-xs font-semibold`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center justify-center flex-col gap-2">
                      {(batch.status === 'for shortlisting' || batch.status === 'for initial review') &&
                        <Button variant="outline" className={`h-9 rounded-lg border-sky-100 px-3 ${batch.status === 'for shortlisting' ? 'bg-sky-100 text-sky-400' : 'bg-gray-200'}`} onClick={() => toggleBatchShortlistFn(batch.id)}>
                          {batch.status === 'for shortlisting' ? 'Mark as Shortlisted' : 'Shortlisted'}
                        </Button>
                      }

                      <Button variant="outline" className="h-9 rounded-lg border-sky-100 px-3 bg-sky-400 text-white" onClick={() => showUpdateDialog(batch)}>
                        <PencilLine className="size-4" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }}
            itemsPerPage={5}
            searchPlaceholder="Search batches"
            onRefresh={() => refetch()}
            isLoading={isFetching}
            emptyText="No batches found yet."
            total={batches.length}
          />
        </CardContent>
      </Card>
      <BatchForm show={batchDialog} onClose={() => setBatchDialog(false)} data={batch} />
    </div>
  );
}

ViewBatches.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
