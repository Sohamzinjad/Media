'use client';

import { useEffect } from 'react';

export function VideoAnalytics({ videoId }: { videoId: string }) {
    useEffect(() => {
        // Simple dedupe check could go here (sessionStorage), but for MVP just fire on mount
        const hasViewed = sessionStorage.getItem(`viewed-${videoId}`);
        if (!hasViewed) {
            fetch('/api/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            }).then(() => {
                sessionStorage.setItem(`viewed-${videoId}`, 'true');
            }).catch(console.error);
        }
    }, [videoId]);

    return null; // Headless component
}
