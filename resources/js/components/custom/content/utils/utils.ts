import type { ViewerFields } from '@/components/custom/content/types';

const SINGLE_PDF_GROUPS = new Set(['sibika.ph', 'storybooks', 'milliconnections', 'cistem']);

export function normalizeValue(value?: string | null): string {
    return String(value ?? '').trim();
}

export function getDisplayValue(value?: string | null): string | null {
    const normalizedValue = normalizeValue(value);

    if (!normalizedValue || normalizedValue === '*') {
        return null;
    }

    return normalizedValue;
}

export function normalizeGroup(value?: string | null): string {
    return normalizeValue(value).toLowerCase();
}

export function toAssetUrl(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
}

export function ensurePdfName(value: string): string {
    return value.toLowerCase().endsWith('.pdf') ? value : `${value}.pdf`;
}

export function ensureDatName(value: string): string {
    return value.toLowerCase().endsWith('.dat') ? value : `${value}.dat`;
}

export function getFileStem(value: string): string {
    return value.replace(/\.[^.]+$/, '');
}

export function splitText(value?: string | null, separatorPattern: RegExp = /[/:]/): string[] {
    return normalizeValue(value)
        .split(separatorPattern)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function isPodcast(fields: ViewerFields): boolean {
    return normalizeValue(fields.Type) === '5'
        || normalizeValue(fields.MaterialType).toLowerCase() === 'podcast';
}

export function isSinglePdfGroup(type: string, contentGroup: string): boolean {
    return type === '1' && SINGLE_PDF_GROUPS.has(contentGroup);
}

export function buildSinglePdfCandidates(fields: ViewerFields): string[] {
    const holdingsId = normalizeValue(fields.HoldingsID);
    const fileName = normalizeValue(fields.FileName);
    const rawCandidates = [fileName, holdingsId].filter(Boolean);
    const fulltextCandidates = rawCandidates.flatMap((value) => {
        const stem = getFileStem(value);

        return [value, stem, ensureDatName(value), stem ? ensureDatName(stem) : ''].filter(Boolean);
    });

    return [...new Set(
        fulltextCandidates.map((candidate) => toAssetUrl(`assets/fulltext/${candidate}`)),
    )];
}

export async function resolveFirstAvailableUrl(candidates: string[]): Promise<string | null> {
    for (const candidate of candidates) {
        try {
            const response = await fetch(candidate, { method: 'HEAD' });

            if (response.ok) {
                return candidate;
            }
        } catch {
            continue;
        }
    }

    return null;
}

export function getContentTypeLabel(type: string): string {
    switch (type) {
        case '1':
            return 'PDF';
        case '2':
            return 'Video';
        case '3':
            return 'HTML';
        case '5':
            return 'Podcast';
        case '7':
            return 'Interactive';
        default:
            return 'Content';
    }
}

export function formatTime(seconds: number): string {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
