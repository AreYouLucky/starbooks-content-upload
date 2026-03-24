import { ReactNode } from 'react'
import type { BreadcrumbItem } from '@/types';
import { useHandleChange } from '@/hooks/use-handle-change';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
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
        title: 'Single Upload Form',
        href: '/single-upload-form',
    },
];
export default function SingleUpload() {
  return (
    <div>SingleUpload</div>
  )
}
SingleUpload.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
