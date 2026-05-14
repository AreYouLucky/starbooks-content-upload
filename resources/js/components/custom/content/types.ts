import type { RefObject } from 'react';
import type { ApprovalRequestModel } from '@/types/model';

export type ViewerFields = ApprovalRequestModel & {
    GeneralNote?: string | null;
    Publication?: string | null;
    attribution?: string | null;
    url?: string | null;
};

export type MediaRendererProps = {
    fields: ViewerFields;
    type: string;
    currentPdfUrl: string | null;
    pdfFiles: string[];
    currentPageIndex: number;
    isPdfLoading: boolean;
    pdfError: string | null;
    isSinglePdf: boolean;
    videoSourceFromHolding: string;
    fallbackVideoSource: string;
    podcastSource: string;
    podcastThumbnail: string;
    iframeSource: string;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    audioRef: RefObject<HTMLAudioElement | null>;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onTogglePlayPause: () => Promise<void>;
    onSkipAudio: (seconds: number) => void;
    onSeekAudio: (value: number) => void;
    formatTime: (seconds: number) => string;
};
