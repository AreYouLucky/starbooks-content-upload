import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table-server';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { useHandleChange } from '@/hooks/use-handle-change';
import {
  CalendarDays,
  CircleCheckBig,
  FileClock,
  FolderSync,
  PencilLine,
  TextSearch,
  Plus,
  BookOpenCheck,
  Search
} from 'lucide-react';
import { type ReactNode } from 'react';

import type { BreadcrumbItem } from '@/types';
import type { BatchModel } from '@/types/model';
import { useFetchBatches } from './partials/batches-hooks';

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

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export default function ViewBatches() {
  const { data, isFetching, refetch } = useFetchBatches();
  const batches = data ?? [];
  const { item, setItem, handleChange } = useHandleChange({
    search: '',
  });
  const stats = [
    {
      label: 'For Committee Review',
      value: batches.filter((batch) => batch.status === 'shortlisted').length,
      icon: FileClock,
      tone: 'bg-slate-50 text-slate-700',
    },
    {
      label: 'For Quality Approval',
      value: batches.filter((batch) => batch.status === 'committee_approval').length,
      icon: TextSearch,
      tone: 'bg-yellow-50 text-yellow-500',
    },
    {
      label: 'Ready to publish',
      value: batches.filter((batch) => batch.status === 'quality_approval').length,
      icon: CircleCheckBig,
      tone: 'bg-sky-50 text-sky-500',
    },
    {
      label: 'Published',
      value: batches.filter((batch) => batch.status === 'published').length,
      icon: BookOpenCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-xl p-4 border md:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-sky-600">
                Batch Management
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Track upload groups, review targets, and publication schedules in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-slate-300 bg-white/80 px-4 text-slate-700 hover:bg-slate-100"
              onClick={() => refetch()}
            >
              <FolderSync className="size-4" />
              Refresh
            </Button>
            <Button className="h-11 rounded-lg bg-sky-500 px-5 text-white hover:bg-sky-600 flex gap-2">
              <Plus className="size-4" />
              New batch
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="gap-0 rounded-xl border-slate-100 py-0 ">
              <CardContent className="flex items-center justify-between px-8 py-5">
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

      <Card className="gap-0 rounded-xl border-slate-100 py-0 ">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 relative">
            <Search className="absolute left-2.5 top-3 text-[#00aeef]" size={16} />
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Search Title"
              onChange={handleChange}
              className="min-w-62.5 h-10 border-[#00aeef] shadow-none ps-8"
            />
          </div>
          <Badge variant="outline" className="rounded-full border-slate-50 bg-sky-50 px-3 py-1 text-slate-600">
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
          </Badge>
        </div>

        <CardContent className="p-4 sm:px-8">
          <PaginatedSearchTable<BatchModel>
            items={batches}
            headers={[
              { name: 'Batch', position: 'left' },
              { name: 'Source', position: 'left' },
              { name: 'Review Timeline', position: 'left' },
              { name: 'Published Date', position: 'center' },
              { name: 'Status', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
            searchBy={(item) =>
              `${item.batch_name} ${item.content_source} ${item.batch_description}`
            }
            renderRow={(batch) => {

              return (
                <tr key={batch.id} className="border-b border-slate-100 bg-white transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">{batch.batch_name}</div>
                      <p className="max-w-md text-sm leading-6 text-slate-500">
                        {batch.batch_description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {batch.content_source}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-sky-500" />
                        Initial: {formatDate(batch.target_initial_review_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-cyan-500" />
                        Committee: {formatDate(batch.target_committee_review_date)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-top text-sm font-medium text-slate-700">
                    {formatDate(batch.target_published_date)}
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center justify-center gap-2">
                      <Button asChild variant="outline" className="h-9 rounded-lg border-slate-100 px-3">
                        <Link href={`/batches/${batch.id}/edit`}>
                          <PencilLine className="size-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }}
            itemsPerPage={10}
            searchPlaceholder="Search batches"
            onRefresh={() => refetch()}
            isLoading={isFetching}
            emptyText="No batches found yet."
            total={batches.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}

ViewBatches.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
