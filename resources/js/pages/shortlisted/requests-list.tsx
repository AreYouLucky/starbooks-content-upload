import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FolderSync, PencilLine, Trash } from 'lucide-react';
import { trimText, purifyDom } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table';
import type { BreadcrumbItem } from '@/types';
import { formatDate } from '@/lib/utils';
import { ApprovalRequestModel, BatchModel } from '@/types/model';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'For Shortlisting',
    href: '/view-shortlisted',
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
  const batch = props.batch;

  const shortlistedCount = approvalRequests.filter((request) => request.approval_status === 1).length;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-sky-100   p-5 shadow-sm md:px-8 py-4 bg-white">
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="space-y-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-sky-500 md:text-2xl uppercase">
                    {batch?.batch_name ?? 'Shortlisting Requests'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-slate-200 bg-sky-500 text-gray-50 px-4"
              >
                <FolderSync className="size-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="gap-0 rounded-2xl border-sky-200 py-0 shadow-sm">
        <CardContent className="px-4 py-4">
          <PaginatedSearchTable<ApprovalRequestModel>
            items={approvalRequests}
            headers={[
              { name: 'Holdings ID', position: 'left' },
              { name: 'Title & Author', position: 'left' },
              { name: 'Abstract', position: 'left' },
              { name: 'Broad Class', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
            searchBy={(item) =>
              `${item.Title ?? ''} ${item.Abstracts ?? ''} ${item.Author ?? ''} ${item.HoldingsID ?? ''}`
            }
            renderRow={(request) => (
              <tr key={request.id ?? request.HoldingsID} className="border-b border-sky-100 bg-white transition hover:bg-sky-50/40">
                <td className="px-6 py-4 align-top">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{request.HoldingsID || 'N/A'}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {request.MaterialType || 'Unspecified Type'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{request.Title || 'Untitled request'}</p>
                    <p className="text-sm text-slate-500">{request.Author || 'Unknown author'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 text-justify">
                    {request.Abstracts !== '' ?
                      <div
                        className="p-2 text-justify"
                        dangerouslySetInnerHTML={{
                          __html: purifyDom(trimText(String(request?.Abstracts), 220) ?? ""),
                        }}
                      /> : 'Not Set'}
                  </p>
                </td>
                <td className="px-6 py-4 text-center align-middle">
                  <p className="text-sm  text-slate-900">{request.BroadClass || 'N/A'}</p>
                </td>
                <td className="px-6 py-4 text-center align-middle ">
                  <div className='flex justify-center items-center w-full gap-2'>
                    <Link href={`/single-upload/${request?.id}/edit`} className=" flex items-center justify-center gap-2 font-semibold h-9 rounded-lg border-sky-100 px-3 bg-sky-500 text-white hover:text-slate-600" >
                      <PencilLine className="size-4" />
                      Edit
                    </Link>
                    <Button variant="outline" className={`h-9 rounded-lg border-sky-100 px-3 bg-red-500 text-white`} >
                      <Trash className="size-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            itemsPerPage={10}
            searchPlaceholder="Search requests"
            emptyText="No requests found for this batch."
          />
        </CardContent>
      </Card>
    </div>
  );
}

RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
