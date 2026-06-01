import React from 'react'
import { Link } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'For Committee Review',
        href: '/committee-review-page',
    },
];


export default function ReviewRequestForm() {
  return (
    <div>ReviewRequestForm</div>
  )
}
ReviewRequestForm.layout = (page: ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;