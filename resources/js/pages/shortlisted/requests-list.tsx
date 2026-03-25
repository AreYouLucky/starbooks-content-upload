import { ReactNode } from 'react'
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { BatchModel, ApprovalRequestModel } from '@/types/model';
import { Button } from '@/components/ui/button';
import { FolderSync } from 'lucide-react';
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'For Shortlisting',
    href: '/shortlisted-page',
  },
  {
    title: 'Requests List',
    href: '/shortlisted-page',
  },
];

export default function RequestList() {
  const { props } = usePage<{ approval_requests?: ApprovalRequestModel[], batch?: BatchModel }>();
  const { approval_requests, batch } = props
  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-xl p-4 border border-sky-100 md:p-8">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-sky-500 uppercase">
                {batch?.batch_name}
              </h1>
              <p className="max-w-4xl text-sm leading-6 text-slate-500 sm:text-base">
                {batch?.batch_description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-slate-300 bg-white/80 px-4 text-slate-700 hover:bg-slate-100"
            >
              <FolderSync className="size-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;

