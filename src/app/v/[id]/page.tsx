import { getVideo } from '@/lib/db';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import Link from 'next/link';
import { Video, AlertCircle } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: PageProps) {
    const { id } = await params;

    // 1. Retrieve video from synchronous DB helper
    const video = getVideo(id);

    // 2. Handle invalid/missing video ID gracefully
    if (!video) {
        return (
            <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8">
                <div className="max-w-md text-center bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
                    <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Video Not Found</h1>
                    <p className="text-neutral-400 mb-6">
                        The video you are looking for does not exist or has been removed.
                    </p>
                    <Link href="/" className="inline-block px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors">
                        Return Home
                    </Link>
                </div>
            </main>
        );
    }

    // 3. Render Page with AnalyticsTracker
    return (
        <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                            <Video className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg">Screen Recorder</span>
                    </Link>
                </div>

                {/* Video Player (handles analytics internally) */}
                <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-neutral-800">
                    <AnalyticsTracker
                        id={video.id}
                        src={`/uploads/${video.filename}`}
                        className="w-full aspect-video object-contain"
                    />
                </div>

                {/* Metadata */}
                <div className="flex justify-between items-center bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <div>
                        <h2 className="text-xl font-bold">Recorded Video</h2>
                        <div className="flex gap-4 text-sm text-neutral-400 mt-1">
                            <span>{new Date(video.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{video.views} views</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
