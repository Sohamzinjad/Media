'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
    src: string;
    videoId: string;
    className?: string;
    poster?: string;
}

export function VideoPlayer({ src, videoId, className, poster }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCompleted, setHasCompleted] = useState(false);

    useEffect(() => {
        // Reset state when src changes
        setHasCompleted(false);
    }, [src]);

    const handleTimeUpdate = () => {
        if (!videoRef.current || hasCompleted) return;

        const { currentTime, duration } = videoRef.current;
        if (duration > 0 && (currentTime / duration) > 0.9) {
            // 90% watched = completion
            setHasCompleted(true);
            fetch('/api/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            }).catch(console.error);
        }
    };

    return (
        <video
            ref={videoRef}
            src={src}
            controls
            className={className}
            poster={poster}
            onTimeUpdate={handleTimeUpdate}
            playsInline
        />
    );
}
