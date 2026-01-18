import { createVideo, getVideo, incrementView, incrementCompletion, readDB } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Reset DB for testing
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
fs.writeFileSync(DB_PATH, JSON.stringify({ videos: {} }));

console.log('Testing Database Layer...');

// 1. Create Video
const videoId = 'test-video-1';
const filename = 'rec-123.webm';
const created = createVideo(videoId, filename);
console.log('Created:', created);

if (created.id !== videoId || created.filename !== filename || created.views !== 0) {
    throw new Error('Create Video failed');
}

// 2. Read DB
const db = readDB();
console.log('Read DB:', db);
const videos = Object.values(db.videos);
if (videos.length !== 1 || videos[0].id !== videoId) {
    throw new Error('Read DB failed');
}

// 3. Increment View
incrementView(videoId);
const viewed = getVideo(videoId);
console.log('Increment View (fetched):', viewed);
if (viewed?.views !== 1) {
    throw new Error('Increment View failed');
}

// 4. Increment Completion
incrementCompletion(videoId);
const completed = getVideo(videoId);
console.log('Increment Completion (fetched):', completed);
if (completed?.completions !== 1) {
    throw new Error('Increment Completion failed');
}

// 5. Get Video
const fetched = getVideo(videoId);
console.log('Get Video:', fetched);
if (!fetched || fetched.views !== 1 || fetched.completions !== 1) {
    throw new Error('Get Video failed');
}

console.log('✅ Database verification passed!');
