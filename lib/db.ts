import fs from 'fs';
import path from 'path';

export interface Video {
    id: string;
    filename: string;
    views: number;
    completions: number;
    createdAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readDB(): Video[] {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return [];
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        return [];
    }
}

export function writeDB(data: Video[]): void {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing DB:', error);
    }
}

export function createVideo(id: string, filename: string): Video {
    const videos = readDB();
    const newVideo: Video = {
        id,
        filename,
        views: 0,
        completions: 0,
        createdAt: new Date().toISOString(),
    };
    videos.push(newVideo);
    writeDB(videos);
    return newVideo;
}

export function getVideo(id: string): Video | undefined {
    const videos = readDB();
    return videos.find((v) => v.id === id);
}

export function incrementView(id: string): Video | undefined {
    const videos = readDB();
    const videoIndex = videos.findIndex((v) => v.id === id);
    if (videoIndex === -1) return undefined;

    videos[videoIndex].views += 1;
    writeDB(videos);
    return videos[videoIndex];
}

export function incrementCompletion(id: string): Video | undefined {
    const videos = readDB();
    const videoIndex = videos.findIndex((v) => v.id === id);
    if (videoIndex === -1) return undefined;

    videos[videoIndex].completions += 1;
    writeDB(videos);
    return videos[videoIndex];
}
