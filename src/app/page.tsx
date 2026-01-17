'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, StopCircle, Play, Scissors, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // 1. Get Screen Stream (Video + System Audio)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: true
      });

      // 2. Get Mic Stream (Audio only)
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // 3. Combine Streams
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...micStream.getAudioTracks(), // Mic audio
        ...screenStream.getAudioTracks() // System audio (if shared)
      ];

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      // 4. Setup Recorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9'
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const file = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(file);
        setRecordedBlob(file);
        setVideoUrl(url);

        // Stop all tracks to clear "recording" indicator
        combinedStream.getTracks().forEach(track => track.stop());
        screenStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());

        setIsRecording(false);
      };

      // Handle user clicking "Stop Sharing" on browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordedBlob(null);
      setVideoUrl(null);

    } catch (err) {
      console.error("Error starting recording:", err);
      // Handle cancellation or permission denial
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Trimming State
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isTrimming, setIsTrimming] = useState(false);

  // When video metadata loads, set duration
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration;
    if (isFinite(duration)) {
      setVideoDuration(duration);
      setTrimStart(0);
      setTrimEnd(duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', recordedBlob);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      // Redirect to video page
      router.push(data.shareUrl);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video');
      setIsUploading(false);
    }
  };

  const handleTrim = async () => {
    if (!recordedBlob) return;

    setIsTrimming(true);
    try {
      const formData = new FormData();
      formData.append('file', recordedBlob);
      formData.append('startTime', trimStart.toString());
      formData.append('endTime', trimEnd.toString());

      const response = await fetch('/api/trim', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Trimming failed');

      const trimmedBlob = await response.blob();
      const trimmedUrl = URL.createObjectURL(trimmedBlob);

      // Clean up old URL
      if (videoUrl) URL.revokeObjectURL(videoUrl);

      setRecordedBlob(trimmedBlob);
      setVideoUrl(trimmedUrl);

      // Reset logic happens in onLoadedMetadata, but we might want to stay in trim mode or reset
      // For now, let's reset trim mode to show we're done
      setIsTrimming(false);

    } catch (error) {
      console.error('Failed to trim:', error);
      alert('Failed to trim video. Please try again.');
      setIsTrimming(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">

        {/* Header */}
        <div className="text-center space-y-4 pt-12">
          <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Screen Recorder
          </h1>
          <p className="text-neutral-400">
            {isRecording ? "Recording in progress..." : "Ready to capture"}
          </p>
        </div>

        {/* Content Area */}
        <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 backdrop-blur-sm min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">

          {videoUrl ? (
            <div className="w-full h-full flex flex-col gap-6">
              <video
                src={videoUrl}
                controls
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full rounded-xl bg-black aspect-video object-contain"
              />

              {/* Trimming Controls */}
              <div className="grid grid-cols-2 gap-8 w-full p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 flex justify-between">
                    <span>Start Time</span>
                    <span className="font-mono text-white">{formatTime(trimStart)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < trimEnd) setTrimStart(val);
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 flex justify-between">
                    <span>End Time</span>
                    <span className="font-mono text-white">{formatTime(trimEnd)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > trimStart) setTrimEnd(val);
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-2">
                <button
                  onClick={() => { setVideoUrl(null); setRecordedBlob(null); setIsTrimming(false); }}
                  className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-full font-medium transition-colors"
                >
                  Discard & New
                </button>
                <button
                  onClick={handleTrim}
                  disabled={isTrimming || isUploading || (trimStart === 0 && trimEnd === videoDuration)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scissors className="w-4 h-4" />
                  {isTrimming ? "Trimming..." : "Trim Video"}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isTrimming || isUploading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {isRecording ? (
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-red-500">
                    REC
                  </div>
                </div>
              ) : (
                <div className="w-32 h-20 border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center text-neutral-600">
                  Preview Area
                </div>
              )}

              <div className="flex gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-neutral-200 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-8 py-4 bg-red-500 text-white rounded-full font-bold text-lg hover:bg-red-400 transition-colors"
                  >
                    <StopCircle className="w-5 h-5 fill-current" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions / Status */}
        <div className="grid grid-cols-3 gap-4 w-full text-sm text-neutral-500 text-center">
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            1. Grant Permissions
          </div>
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            2. Share Screen
          </div>
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            3. Review & Upload
          </div>
        </div>

      </div>
    </main>
  );
}
