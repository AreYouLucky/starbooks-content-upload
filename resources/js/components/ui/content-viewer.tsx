import React, { useEffect, useRef, useState } from "react";
import { ApprovalRequestModel } from "@/types/model";
type Props = {
    pdfs?: string[];
    fields: ApprovalRequestModel;
};

const ContentViewer: React.FC<Props> = ({ pdfs, fields }) => {
    const [index, setIndex] = useState(0);
    const [currentPdf, setCurrentPdf] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const safePdfs = pdfs ?? [];
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [seekBarValue, setSeekBarValue] = useState(0);

    // ---------- PDF ----------
    const generatePdfUrl = (filePath: string) => {
        return `${window.location.origin}/${filePath}`;
    };

    const displayPdf = (i: number) => {
        if (safePdfs[i]) {
            setCurrentPdf(generatePdfUrl(safePdfs[i]));
        }
    };

    const nextPdf = () => {
        if (index + 1 < safePdfs.length) {
            const newIndex = index + 1;
            setIndex(newIndex);
            displayPdf(newIndex);
        }
    };

    const previousPdf = () => {
        if (index > 0) {
            const newIndex = index - 1;
            setIndex(newIndex);
            displayPdf(newIndex);
        }
    };

    // ---------- AUDIO ----------
    const togglePlayPause = () => {
        if (!audioRef.current) return;

        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const updateCurrentTime = () => {
        if (!audioRef.current) return;

        const time = Math.floor(audioRef.current.currentTime);
        setCurrentTime(time);
        setSeekBarValue(time);
    };

    const seekAudio = (value: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = value;
        setSeekBarValue(value);
    };

    const skipForward = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.min(
            audioRef.current.currentTime + 10,
            audioRef.current.duration
        );
    };

    const playPrevious = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(
            audioRef.current.currentTime - 10,
            0
        );
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // ---------- INIT ----------
    useEffect(() => {
        if (safePdfs.length > 0) {
            displayPdf(0);
        }
    }, [safePdfs]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(Math.floor(audio.duration));

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", updateCurrentTime);

        return () => {
            audio.pause();
            audio.removeEventListener("timeupdate", updateCurrentTime);
            audio.removeEventListener("loadedmetadata", onLoaded);
        };
    }, []);

    return (
        <div className="p-6">
            <h3 className="mb-4 text-xl font-bold">{fields.Title}</h3>

            {/* AUTHORS */}
            {fields.Author && (
                <p className="text-sm mb-2">
                    By:{" "}
                    {fields.Author.split("/").map((author: string, i: number) => (
                        <span key={i}>
                            {author},
                        </span>
                    ))}
                </p>
            )}

            {/* PDF */}
            {fields?.Type ===  "1" && currentPdf && (
                <>
                    <iframe
                        src={currentPdf}
                        className="w-full h-200 border-none"
                    />

                    <div className="flex gap-2 mt-2">
                        <button onClick={previousPdf} disabled={index === 0}>
                            Previous
                        </button>

                        <button onClick={nextPdf} disabled={index + 1 >= safePdfs.length}>
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* VIDEO */}
            {fields.Type && fields.Type === "2" && (
                <video width="100%" controls autoPlay muted>
                    <source
                        src={`/storage/assets/fullvideo/flv/${fields.HoldingsID}.dat`}
                        type="video/mp4"
                    />
                </video>
            )}

            {/* PODCAST */}
            {fields.Type === "5" && fields.MaterialType === "PODCAST" && (
                <div className="mt-5">
                    <audio ref={audioRef}>
                        <source
                            src={`/storage/assets/FlipScience/${fields.HoldingsID}.dat`}
                            type="audio/mpeg"
                        />
                    </audio>

                    <div className="flex gap-2">
                        <button onClick={playPrevious}>⏪</button>
                        <button onClick={togglePlayPause}>
                            {isPlaying ? "Pause" : "Play"}
                        </button>
                        <button onClick={skipForward}>⏩</button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <span>{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            value={seekBarValue}
                            max={duration}
                            onChange={(e) => seekAudio(Number(e.target.value))}
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentViewer;