'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Loader2 } from 'lucide-react';

// For now, I'll just use 'any' or localized interface to avoid importing server code in client accidentally if db.ts has server-only deps (fs).
// Actually db.ts imports 'fs', so it cannot be imported in client components.
// I should define types in a separate file or just inline.

interface VideoType {
    id: string;
    originalFilename: string;
    trimmedFilename?: string;
    createdAt: number;
    views: number;
    duration?: number;
}

export function TrimEditor({ video }: { video: VideoType }) {
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(10); // Default 10s or max
    const [isTrimming, setIsTrimming] = useState(false);
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setEnd(dur);
        }
    };

    const handleTrim = async () => {
        setIsTrimming(true);
        try {
            const res = await fetch('/api/trim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: video.id, start, end })
            });
            const data = await res.json();
            if (data.success) {
                router.refresh(); // Refresh to show trimmed video? Or maybe just alert for now.
                // Or maybe we redirect to a new view?
                // For MVP: Update local state or just reload.
                alert('Video trimmed successfully! Refreshing...');
                window.location.reload();
            } else {
                alert('Trim failed');
            }
        } catch (e) {
            console.error(e);
            alert('Trim failed');
        } finally {
            setIsTrimming(false);
        }
    };

    return (
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Scissors className="w-5 h-5" /> Trim Video
            </h3>

            {/* Hidden video to get metadata if needed, or use the main one if we pass ref? 
                Actually we can just use the inputs. 
            */}
            <video
                src={`/uploads/${video.originalFilename}`}
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
            />

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm text-neutral-400">Start Time (sec)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={duration}
                            value={start}
                            onChange={(e) => setStart(Number(e.target.value))}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm text-neutral-400">End Time (sec)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={duration}
                            value={end}
                            onChange={(e) => setEnd(Number(e.target.value))}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="p-4 bg-neutral-800/50 rounded-lg">
                    <div className="flex justify-between text-sm text-neutral-400 mb-2">
                        <span>Preview Range</span>
                        <span>{Math.max(0, end - start).toFixed(1)}s duration</span>
                    </div>
                    {/* Visual slider could go here, for now just inputs */}
                </div>

                <button
                    onClick={handleTrim}
                    disabled={isTrimming || end <= start}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                    {isTrimming ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Scissors className="w-5 h-5" />
                            Trim Video
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
