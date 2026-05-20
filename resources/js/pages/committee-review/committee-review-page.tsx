import { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'For Committee Review',
        href: '/view-committee-review-batches',
    },
];
export default function CommitteeReviewPage() {
    return (
        <div className="space-y-4 p-1">
            <section className="relative overflow-hidden rounded-lg border border-sky-200 bg-sky-500 p-5 text-white shadow-sm md:p-7">
                <div className="relative flex flex-col gap-4 lg:flex-row lg:justify-between items-center">
                </div>
            </section>
            <section className='p-4 bg-white rounded-lg shadow-sm'>

            </section>
        </div>
    )
}
CommitteeReviewPage.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
