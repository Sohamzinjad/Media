'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mic, Video as VideoIcon, Square, Upload, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function Recorder() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (videoPreviewRef.current && stream) {
            videoPreviewRef.current.srcObject = stream;
        }
    }, [stream]);

    const startRecording = async () => {
        try {
            // Get screen stream (video + optional system audio)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1920, height: 1080 },
                audio: false // Simplicity: Just mic audio for now, or true if we want system audio too
            });

            // Get mic stream
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            // Combine video from screen and audio from mic
            // Note: If screenStream has audio (system audio), we might want to mix it. 
            // For MVP, we'll just prioritize mic audio + screen video.
            const tracks = [
                ...screenStream.getVideoTracks(),
                ...micStream.getAudioTracks()
            ];

            const combinedStream = new MediaStream(tracks);
            setStream(combinedStream);

            // Handle stream end (user clicks "Stop sharing" in browser UI)
            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
                ? 'video/webm; codecs=vp9'
                : 'video/webm';

            const recorder = new MediaRecorder(combinedStream, { mimeType });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const fullBlob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(fullBlob);

                // cleanup tracks
                combinedStream.getTracks().forEach(track => track.stop());
                screenStream.getTracks().forEach(track => track.stop());
                micStream.getTracks().forEach(track => track.stop());
                setStream(null);
            };

            recorder.start();
            setIsRecording(true);

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Could not start recording. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const uploadVideo = async () => {
        if (!recordedBlob) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', recordedBlob, 'recording.webm');

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                router.push(`/video/${data.video.id}`);
            } else {
                console.error('Upload failed', data);
                alert('Upload failed');
            }
        } catch (e) {
            console.error(e);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setRecordedBlob(null);
        setStream(null);
        setIsRecording(false);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-6">

            {/* Preview Area */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-neutral-800">
                {!stream && !recordedBlob && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                        <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Ready to Record</p>
                    </div>
                )}

                {stream && (
                    <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted // Mute preview so we don't get feedback loop
                        playsInline
                        className="w-full h-full object-contain"
                    />
                )}

                {recordedBlob && !stream && (
                    <video
                        src={URL.createObjectURL(recordedBlob)}
                        controls
                        className="w-full h-full object-contain"
                    />
                )}

                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        Recording
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {!isRecording && !recordedBlob && (
                    <button
                        onClick={startRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                    >
                        <Mic className="w-5 h-5" />
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/25"
                    >
                        <Square className="w-5 h-5 fill-current" />
                        Stop Recording
                    </button>
                )}

                {recordedBlob && !isUploading && (
                    <>
                        <button
                            onClick={uploadVideo}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-green-500/25"
                        >
                            <Upload className="w-5 h-5" />
                            Save & Upload
                        </button>
                        <button
                            onClick={reset}
                            className="px-6 py-3 text-neutral-400 hover:text-white font-medium transition-colors"
                        >
                            Discard
                        </button>
                    </>
                )}

                {isUploading && (
                    <div className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-neutral-300 rounded-full font-medium">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                    </div>
                )}
            </div>
        </div>
    );
}
