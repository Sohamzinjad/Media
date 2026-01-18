import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

export interface VideoData {
    id: string;
    filename: string;
    views: number;
    completions: number;
    createdAt: string;
}

export interface Database {
    videos: Record<string, VideoData>;
}

// Helper to ensure DB exists
function ensureDB() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        const initialDB: Database = { videos: {} };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    }
}

export function readDB(): Database {
    try {
        ensureDB();
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);

        // Basic validation/migration if needed (handle array vs object legacy)
        if (Array.isArray(parsed)) {
            const migrated: Database = { videos: {} };
            parsed.forEach((v: VideoData) => {
                if (v.id) migrated.videos[v.id] = v;
            });
            writeDB(migrated);
            return migrated;
        }

        if (!parsed.videos) {
            return { videos: {} };
        }

        return parsed;
    } catch (error) {
        console.error('Error reading DB:', error);
        return { videos: {} };
    }
}

export function writeDB(db: Database) {
    try {
        ensureDB();
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error('Error writing DB:', error);
    }
}

export function createVideo(id: string, filename: string): VideoData {
    const db = readDB();
    const newVideo: VideoData = {
        id,
        filename,
        views: 0,
        completions: 0,
        createdAt: new Date().toISOString(),
    };
    db.videos[id] = newVideo;
    writeDB(db);
    return newVideo;
}

export function incrementView(id: string) {
    const db = readDB();
    if (db.videos[id]) {
        db.videos[id].views += 1;
        writeDB(db);
    }
}

export function incrementCompletion(id: string) {
    const db = readDB();
    if (db.videos[id]) {
        db.videos[id].completions += 1;
        writeDB(db);
    }
}

export function getVideo(id: string): VideoData | undefined {
    const db = readDB();
    return db.videos[id];
}
