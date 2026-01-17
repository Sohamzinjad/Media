import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createVideo } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const id = uuidv4();
        const fileName = `${id}.webm`;

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Save to DB
        createVideo(id, fileName);

        return NextResponse.json({
            id,
            url: `/uploads/${fileName}`,
            shareUrl: `/v/${id}`
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload video' },
            { status: 500 }
        );
    }
}
