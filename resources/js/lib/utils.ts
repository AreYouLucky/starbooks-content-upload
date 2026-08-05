import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
  return typeof url === 'string' ? url : url.url;
}

export const formatDate = (value: string) => {
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

import DOMPurify from "dompurify";


export function purifyDom(text: string) {
  return DOMPurify.sanitize(text);
}

export function trimText(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  } else {
    return text;
  }
}

export const displayDate = (date?: string) => {
  return date ? formatDate(date) : 'NA';
};

export function getPageFromUrl(url: string | null): number | null {
    if (!url) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);
        const page = Number(parsedUrl.searchParams.get('page'));

        return Number.isFinite(page) && page > 0 ? page : null;
    } catch {
        return null;
    }
}

