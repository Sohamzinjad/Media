import { NextRequest, NextResponse } from 'next/server';
import { incrementView, incrementCompletion } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, event } = body;

        if (!id || !['view', 'complete'].includes(event)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        if (event === 'view') {
            incrementView(id);
        } else if (event === 'complete') {
            incrementCompletion(id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
