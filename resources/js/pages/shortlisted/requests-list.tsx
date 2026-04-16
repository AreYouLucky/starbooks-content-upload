import { ReactNode, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FolderSync, PencilLine, Trash } from 'lucide-react';
import { trimText, purifyDom } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginatedSearchTable from '@/components/ui/data-table';
import type { BreadcrumbItem } from '@/types';
import { ApprovalRequestModel, BatchModel } from '@/types/model';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useDeleteSingleRequest } from './partials/upload-hooks';
import { downloadShortlisted } from '@/lib/excel-download';
import ContentViewer from '@/components/ui/content-viewer';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [id, setId] = useState<number | null>(0);
  const deleteSingleRequest = useDeleteSingleRequest();
  const deleteSingleRequestFn = () => {
    deleteSingleRequest.mutate(id as number, {
      onSuccess: () => {
        toast.success('Request Deleted Successfully');
        window.location.reload();
      },
    });
  }


  const viewContent = () => {

  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-sky-100 text-gray-50  p-5 shadow-sm md:px-8 py-6 bg-sky-500">
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
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 px-4"
                onClick={() => {
                  if (!batch) return;
                  downloadShortlisted({
                    records: approvalRequests,
                    batch: batch,
                  });
                }}
              >
                <FolderSync className="size-4" />
                Export Excel
              </Button>
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
              { name: 'Title & Author', position: 'left' },
              { name: 'Abstract', position: 'left' },
              { name: 'Broad Class', position: 'center' },
              { name: 'Actions', position: 'center' },
            ]}
            searchBy={(item) =>
              `${item.Title ?? ''} ${item.Abstracts ?? ''} ${item.Author ?? ''} ${item.HoldingsID ?? ''}`
            }
            renderRow={(request) => (
              <tr key={request.id ?? request.HoldingsID} className="border-b border-gray-100 bg-white transition hover:bg-gray-100/40">
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
                  <p className="text-sm  text-slate-900">{request.BroadClass || 'N/A'}</p>
                </td>
                <td className="px-6 py-4 text-center align-middle ">
                  <div className='flex justify-center items-center w-full gap-2'>
                    <Link href={`/single-upload/${request?.id}/edit`} className="hover:scale-105 flex items-center justify-center gap-2 font-semibold h-9 rounded-lg border border-sky-300 px-3 bg-sky-500 text-slate-50 hover:text-white" >
                      <PencilLine className="size-4" />
                      Edit
                    </Link>
                    <Button variant="outline" className={` transition-all hover:scale-105 h-9 rounded-lg bg-red-400 text-slate-50 hover:text-white hover:bg-orange/80 px-3 `} onClick={() => { setId(Number(request.id)); setIsDialogOpen(true) }}>
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
      <ConfirmationDialog show={isDialogOpen} onClose={() => setIsDialogOpen(false)} message='Are you sure you want to delete this request?' type={2} onConfirm={deleteSingleRequestFn} />
    </div>
  );
}

RequestList.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
