'use client';

import { useEffect, useRef } from 'react';

interface AnalyticsTrackerProps {
    id: string;
    src: string;
    className?: string;
}

export function AnalyticsTracker({ id, src, className }: AnalyticsTrackerProps) {
    const hasViewedRef = useRef(false);

    useEffect(() => {
        // Ensure we only fire view event once per mount
        if (hasViewedRef.current) return;

        // Fire view event
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, event: 'view' })
        }).catch(err => console.error('Failed to track view:', err));

        hasViewedRef.current = true;
    }, [id]);

    const handleEnded = () => {
        // Fire completion event
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, event: 'complete' })
        }).catch(err => console.error('Failed to track completion:', err));
    };

    return (
        <video
            src={src}
            className={className}
            controls
            autoPlay
            playsInline
            onEnded={handleEnded}
        />
    );
}
