import MediaRenderer from '@/components/custom/content/media-renderer';
import type { ViewerFields } from '@/components/custom/content/types';
import { buildSinglePdfCandidates, formatTime, getDisplayValue, isPodcast, isSinglePdfGroup, normalizeGroup, normalizeValue, resolveFirstAvailableUrl, splitText, toAssetUrl } from '@/components/custom/content/utils/utils';
import { cn, purifyDom } from '@/lib/utils';
import { type JSX, useEffect, useRef, useState } from 'react';

type Props = {
    fields: ViewerFields;
};

export default function ContentViewer({ fields }: Props): JSX.Element {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [pdfFiles, setPdfFiles] = useState<string[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [singlePdfUrl, setSinglePdfUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const contentGroup = normalizeGroup(fields.Contents);
    const type = normalizeValue(fields.Type);
    const holdingsId = normalizeValue(fields.HoldingsID);
    const holdingsIdDisplay = getDisplayValue(fields.HoldingsID);
    const materialTypeDisplay = getDisplayValue(fields.MaterialType);
    const journalTitleDisplay = getDisplayValue(fields.JournalTitle);
    const volumeNoDisplay = getDisplayValue(fields.VolumeNo);
    const issueNoDisplay = getDisplayValue(fields.IssueNo);
    const issueDateDisplay = getDisplayValue(fields.IssueDate);
    const agencyCodeDisplay = getDisplayValue(fields.AgencyCode);
    const subjectDisplay = getDisplayValue(fields.Subject);
    const broadClassDisplay = getDisplayValue(fields.BroadClass);
    const subtitleDisplay = getDisplayValue(fields.SubTitle);
    const abstractDisplay = getDisplayValue(fields.Abstracts);
    const currentPdfUrl = singlePdfUrl ?? pdfFiles[currentPageIndex] ?? null;
    const isSinglePdf = isSinglePdfGroup(type, contentGroup);
    const authors = splitText(fields.Author, /\//);
    const publications = splitText(fields.Publication, /:/);
    const tags = splitText(fields.Subject, /\//);
    const videoSourceFromHolding = holdingsId ? toAssetUrl(`assets/fullvideo/flv/${holdingsId}.dat`) : '';
    const fallbackVideoFileName = normalizeValue(fields.FileName);
    const fallbackVideoSource = fallbackVideoFileName.length > 3
        ? toAssetUrl(`assets/fullvideo/flv/${fallbackVideoFileName.slice(0, -3)}dat`)
        : '';
    const podcastSource = holdingsId ? toAssetUrl(`assets/FlipScience/${holdingsId}.dat`) : '';
    const podcastThumbnail = holdingsId ? toAssetUrl(`assets/images/thumbs/${holdingsId}.png`) : '';
    const iframeSource = holdingsId ? toAssetUrl(`assets/Shneider/${holdingsId}/index.html`) : '';

    useEffect(() => {
        let isActive = true;

        async function loadPdfViewerData(): Promise<void> {
            if (type !== '1') {
                setPdfFiles([]);
                setSinglePdfUrl(null);
                setPdfError(null);
                setCurrentPageIndex(0);
                return;
            }

            setIsPdfLoading(true);
            setPdfError(null);
            setPdfFiles([]);
            setSinglePdfUrl(null);
            setCurrentPageIndex(0);

            try {
                if (isSinglePdf) {
                    const resolvedUrl = await resolveFirstAvailableUrl(buildSinglePdfCandidates(fields));

                    if (!isActive) {
                        return;
                    }

                    if (!resolvedUrl) {
                        setPdfError('No PDF file was found for this content.');
                    } else {
                        setSinglePdfUrl(resolvedUrl);
                    }

                    return;
                }

                if (!holdingsId) {
                    setPdfError('This record has no Holdings ID for PDF lookup.');
                    return;
                }
                const response = await fetch(`/viewer/${encodeURIComponent(holdingsId)}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to load PDF pages.');
                }

                const payload: unknown = await response.json();
                const files = Array.isArray(payload)
                    ? payload.filter((item): item is string => typeof item === 'string' && item.length > 0)
                    : [];

                if (!isActive) {
                    return;
                }
                if (files.length === 0) {
                    setPdfError('No PDF pages were found for this content.');
                    return;
                }
                setPdfFiles(files.map((file) => toAssetUrl(file)));
            } catch {
                if (isActive) {
                    setPdfError('Unable to load the content preview right now.');
                }
            } finally {
                if (isActive) {
                    setIsPdfLoading(false);
                }
            }
        }

        void loadPdfViewerData();

        return () => {
            isActive = false;
        };
    }, [fields, holdingsId, isSinglePdf, type]);

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio || !isPodcast(fields)) {
            return;
        }

        const handleLoadedMetadata = (): void => {
            setDuration(Math.floor(audio.duration || 0));
        };

        const handleTimeUpdate = (): void => {
            setCurrentTime(Math.floor(audio.currentTime || 0));
        };

        const handlePause = (): void => {
            setIsPlaying(false);
        };

        const handlePlay = (): void => {
            setIsPlaying(true);
        };

        const handleEnded = (): void => {
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [fields]);

    function goToPreviousPage(): void {
        setCurrentPageIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    }

    function goToNextPage(): void {
        setCurrentPageIndex((currentIndex) => Math.min(currentIndex + 1, pdfFiles.length - 1));
    }

    async function togglePlayPause(): Promise<void> {
        if (!audioRef.current) {
            return;
        }

        if (audioRef.current.paused) {
            await audioRef.current.play();
            return;
        }

        audioRef.current.pause();
    }

    function skipAudio(seconds: number): void {
        if (!audioRef.current) {
            return;
        }

        const nextTime = Math.min(
            Math.max(audioRef.current.currentTime + seconds, 0),
            audioRef.current.duration || 0,
        );

        audioRef.current.currentTime = nextTime;
        setCurrentTime(Math.floor(nextTime));
    }

    function seekAudio(nextValue: number): void {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime = nextValue;
        setCurrentTime(Math.floor(nextValue));
    }

    return (
        <div className="space-y-4 bg-white/95 p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(320px,2fr)_minmax(0,1fr)]">
                <div className="space-y-2.5 pr-6 border-gray-200">
                    <div className="space-y-6 ">
                        <div className="space-y-4">
                            <MediaRenderer
                                fields={fields}
                                type={type}
                                currentPdfUrl={currentPdfUrl}
                                pdfFiles={pdfFiles}
                                currentPageIndex={currentPageIndex}
                                isPdfLoading={isPdfLoading}
                                pdfError={pdfError}
                                isSinglePdf={isSinglePdf}
                                videoSourceFromHolding={videoSourceFromHolding}
                                fallbackVideoSource={fallbackVideoSource}
                                podcastSource={podcastSource}
                                podcastThumbnail={podcastThumbnail}
                                iframeSource={iframeSource}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                duration={duration}
                                audioRef={audioRef}
                                onPreviousPage={goToPreviousPage}
                                onNextPage={goToNextPage}
                                onTogglePlayPause={togglePlayPause}
                                onSkipAudio={skipAudio}
                                onSeekAudio={seekAudio}
                                formatTime={formatTime}
                            />
                        </div>


                    </div>
                </div>
                <div className="space-y-6 flex flex-col ">
                    <div>
                        <div className="space-y-2">

                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold leading-tight text-slate-900">
                                    {fields.Title || 'Untitled content'}
                                </h2>
                                {subtitleDisplay ? (
                                    <p className="text-sm leading-6 text-slate-500">{subtitleDisplay}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-4 mt-2">

                            {authors.length > 0 ? (

                                <p className="text-sm  text-slate-500">
                                    Authors:
                                    {authors.map((author) => (
                                        <span
                                            key={author}
                                            className="ml-2"
                                        >
                                            {author}
                                        </span>
                                    ))}
                                </p>

                            ) : null}

                            {publications.length > 0 ? (
                                <p className="text-sm  text-slate-500">
                                    Publications:
                                    {publications.map((publication) => (
                                        <span className="ml-2" key={publication}>{publication}</span>
                                    ))}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className=" h-fit">
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-800 uppercase">
                                Additional Information
                            </div>
                            <div className="divide-y divide-slate-200">
                                {journalTitleDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Journal Title
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {journalTitleDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {volumeNoDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Volume No
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {volumeNoDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {issueNoDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Serial No
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {issueNoDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {issueDateDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Issue Date
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {issueDateDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {holdingsIdDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Holdings ID
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {holdingsIdDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {materialTypeDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Material Type
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {materialTypeDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {agencyCodeDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Agency Code
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {agencyCodeDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {subjectDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Subject
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {subjectDisplay}
                                        </div>
                                    </div>
                                ) : null}

                                {broadClassDisplay ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Broad Class
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {broadClassDisplay}
                                        </div>
                                    </div>
                                ) : null}
                                {tags.length > 0 ? (
                                    <div className="grid grid-cols-[140px_minmax(0,1fr)]">
                                        <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                            Tags
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-600">
                                            {tags.map((tag, index) => (
                                                <span key={`${tag}-${index}`} className="text-slate-600">
                                                    {tag}
                                                    {index < tags.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="">
                {abstractDisplay ? (
                    <div className="gap-0 rounded-[28px]">
                        <div className="space-y-3">
                            <p className="text-base font-bold text-slate-700 px-2">
                                ABSTRACT:
                            </p>
                            <div
                                className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600 text-justify')}
                                dangerouslySetInnerHTML={{ __html: purifyDom(abstractDisplay) }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
