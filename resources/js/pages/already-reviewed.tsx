import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { CheckCircle2, Clock3, FileCheck2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Already Reviewed',
        href: '/already-reviewed',
    },
];


export default function AlreadyReviewed() {
    return (
        <>
            <Head title="Already Reviewed" />

            <div className="space-y-5 p-1">
                <Card className="gap-0 rounded-2xl border-sky-200 py-5 shadow-sm">
                    <CardContent className="p-8">
                        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-sky-200 bg-sky-50/50 text-center py-10">
                            <FileCheck2 className="size-10 text-sky-500" />
                            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                                Content Already Reviewed
                            </h2>

                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AlreadyReviewed.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
