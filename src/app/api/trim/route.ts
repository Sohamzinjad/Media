import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import { writeFile, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Configure ffmpeg path
let ffmpegPath = pathToFfmpeg;

// Fallback for Next.js dev environment if path is incorrect (e.g. /ROOT/...)
if (ffmpegPath && !existsSync(ffmpegPath)) {
    const localPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    if (existsSync(localPath)) {
        ffmpegPath = localPath;
    }
}

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const startTime = parseFloat(formData.get('startTime') as string);
        const endTime = parseFloat(formData.get('endTime') as string);

        if (!file || isNaN(startTime) || isNaN(endTime)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Create temp paths
        const tempDir = os.tmpdir();
        const inputPath = join(tempDir, `input-${uuidv4()}.webm`);
        const outputPath = join(tempDir, `output-${uuidv4()}.webm`);

        // Write input file
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(inputPath, buffer);

        // Perform trimming
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .setStartTime(startTime)
                .setDuration(endTime - startTime)
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        // Read result
        const trimmedBuffer = await readFile(outputPath);

        // Cleanup
        await Promise.allSettled([
            unlink(inputPath),
            unlink(outputPath)
        ]);

        return new NextResponse(trimmedBuffer, {
            headers: {
                'Content-Type': 'video/webm',
            },
        });

    } catch (error) {
        console.error('Trimming error:', error);
        return NextResponse.json(
            { error: 'Failed to process video' },
            { status: 500 }
        );
    }
}
