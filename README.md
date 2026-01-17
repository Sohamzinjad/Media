# Media Recorder MVP

A lightweight, production-ready screen and microphone recorder built with Next.js. Features in-browser recording, server-side trimming, local file video sharing, and basic viewing analytics.

## Features

- **Browser-based Recording**: Captures screen and microphone using the standard MediaRecorder API.
- **Trimming**: Server-side video trimming using `fluent-ffmpeg`.
- **Sharing**: Generates unique shareable links for videos.
- **Analytics**: Tracks unique views and watch completions.
- **Storage**: File-based local storage (no cloud dependency).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video Processing**: fluent-ffmpeg, ffmpeg-static
- **Icons**: Lucide React

## Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open in Browser**
    Navigate to `http://localhost:3000`

## Architecture & Decisions

*   **Client-Side Recording**: Chosen for privacy and latency. The browser handles the heavy lifting of capturing the stream.
*   **Server-Side Trimming**: Video editing in the browser (via WebAssembly) can be heavy and inconsistent. We offload trimming to the server using `ffmpeg` for reliability.
*   **File-System Persistence**: For this MVP, we use the local filesystem (`public/uploads` and `data/db.json`) to avoid cloud setup complexity. In production, this would be replaced by S3/Blob Storage and a designated database (Postgres/Redis).
*   **Fluent FFmpeg**: Used over executing raw shell commands for better safety and error handling.

## Tradeoffs

*   **Ephemeral Storage**: videos are stored in `public/uploads`. On serverless deployments (like Vercel), these files will persist only for the duration of the function execution or be lost on redeploy. **Deployment requires a persistent filesystem (VPS/Docker volume).**
*   **Memory Usage**: processing large video files for trimming loads them into memory buffers. For larger scale, streams should be used.
*   **Browser Compatibility**: Relies on modern `getDisplayMedia` support (Chrome/Edge/Firefox/Safari 13+).

## Future Improvements

*   Cloud storage integration (AWS S3 / R2).
*   User authentication for managing recordings.
*   Transcoding layer (ensure all videos are optimized mp4/hls).
*   Client-side trimming preview frames.
