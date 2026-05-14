import { Button } from '@/components/ui/button';
import { purifyDom } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward, Volume2, } from 'lucide-react';
import type { JSX } from 'react';
import type { MediaRendererProps } from '@/components/custom/content/types';
import { isPodcast, normalizeValue } from '@/components/custom/content/utils/utils';

export default function MediaRenderer({ fields, type, currentPdfUrl, pdfFiles, currentPageIndex, isPdfLoading, pdfError, isSinglePdf, videoSourceFromHolding, fallbackVideoSource, podcastSource, podcastThumbnail, iframeSource, isPlaying, currentTime, duration, audioRef, onPreviousPage, onNextPage, onTogglePlayPause, onSkipAudio, onSeekAudio, formatTime, }: MediaRendererProps): JSX.Element {
    if (type === '1') {
        if (isPdfLoading) {
            return (
                <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-sky-100 bg-slate-50 text-sm text-slate-500">
                    Loading content preview...
                </div>
            );
        }

        if (pdfError) {
            return (
                <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
                    {pdfError}
                </div>
            );
        }

        if (!currentPdfUrl) {
            return (
                <div className="flex min-h-[60vh] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
                    No preview file is available for this record.
                </div>
            );
        }

        const pageCount = isSinglePdf ? 1 : pdfFiles.length;
        const pageLabel = isSinglePdf ? '' : `Page ${currentPageIndex + 1} of ${pageCount}`;

        return (
            <div className="">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                    <iframe
                        key={currentPdfUrl}
                        title={fields.Title ?? 'Content preview'}
                        src={currentPdfUrl}
                        className="min-h-[70vh] w-full bg-white scroll-slim"
                    />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3  py-2">
                    <div className="flex items-center gap-1">
                        {!isSinglePdf && (
                            <>
                                <Button
                                    type="button"
                                    className="px-1 text-sm p-0"
                                    onClick={onPreviousPage}
                                    disabled={currentPageIndex === 0}
                                >
                                    <ChevronLeft className="size-4" />
                                    Prev
                                </Button>
                                <Button
                                    type="button"
                                    className="px-1 text-sm p-0"
                                    onClick={onNextPage}
                                    disabled={currentPageIndex >= pdfFiles.length - 1}
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className=" px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-800">
                            {pageLabel}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (type === '2') {
        return (
            <div className="space-y-4">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm">
                    <video className="min-h-[60vh] w-full bg-black" controls autoPlay muted>
                        {videoSourceFromHolding ? <source src={videoSourceFromHolding} type="video/mp4" /> : null}
                        {fallbackVideoSource ? <source src={fallbackVideoSource} type="video/mp4" /> : null}
                    </video>
                </div>
            </div>
        );
    }

    if (type === '3') {
        return (
            <article
                className="prose prose-slate max-w-none rounded-[28px] border border-slate-200 bg-white p-6 text-sm leading-7 shadow-sm"
                dangerouslySetInnerHTML={{ __html: purifyDom(normalizeValue(fields.Abstracts)) }}
            />
        );
    }

    if (isPodcast(fields)) {
        return (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[minmax(260px,340px)_1fr]">
                    <div className="border-b border-white/10 bg-slate-900 lg:border-r lg:border-b-0">
                        {podcastThumbnail ? (
                            <img
                                src={podcastThumbnail}
                                alt={fields.Title ?? 'Podcast artwork'}
                                className="h-full min-h-70 w-full object-cover"
                            />
                        ) : (
                            <div className="flex min-h-70 items-center justify-center bg-slate-900 text-slate-400">
                                <Volume2 className="size-12" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 p-6 lg:p-8">
                        <div className="space-y-3">
                            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
                                Podcast
                            </span>
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-white">
                                    {fields.Title || 'Untitled Podcast'}
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-slate-300">
                                    {normalizeValue(fields.Abstracts) || 'No abstract available for this podcast.'}
                                </p>
                            </div>
                        </div>

                        <audio ref={audioRef}>
                            {podcastSource ? <source src={podcastSource} type="audio/mpeg" /> : null}
                        </audio>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="button" variant="secondary" className="rounded-xl" onClick={() => onSkipAudio(-10)}>
                                <SkipBack className="size-4" />
                                10s
                            </Button>
                            <Button type="button" className="rounded-xl bg-sky-600 text-white hover:bg-sky-700" onClick={() => void onTogglePlayPause()}>
                                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {isPlaying ? 'Pause' : 'Play'}
                            </Button>
                            <Button type="button" variant="secondary" className="rounded-xl" onClick={() => onSkipAudio(10)}>
                                <SkipForward className="size-4" />
                                10s
                            </Button>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                value={Math.min(currentTime, duration)}
                                onChange={(event) => onSeekAudio(Number(event.target.value))}
                                className="accent-sky-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === '7') {
        return (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <iframe
                    title={fields.Title ?? 'Interactive content'}
                    src={iframeSource}
                    className="min-h-[72vh] w-full"
                />
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
            This content type does not have a preview layout yet.
        </div>
    );
}
