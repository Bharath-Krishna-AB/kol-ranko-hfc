// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '../../../core/orchestrator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, context } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid "text" field in request body' },
                { status: 400 }
            );
        }

        // Context is optional
        if (context !== undefined && typeof context !== 'string') {
            return NextResponse.json(
                { error: 'Invalid "context" field - must be a string' },
                { status: 400 }
            );
        }

        const result = await runPipeline(text, context);

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Pipeline error:', error);
        return NextResponse.json(
            {
                error: 'Pipeline execution failed',
                message: error.message
            },
            { status: 500 }
        );
    }
}