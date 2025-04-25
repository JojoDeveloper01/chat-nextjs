import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ApiError } from '@/types/errors';
import { db } from '@/lib/db';

export async function GET() { // Remove _req parameter if not using it
    try {
        const user = await requireAuth();
        const chats = await db.chats.findAll(user.id);
        return NextResponse.json(chats);
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { error: apiError.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { receiverId } = await request.json();

        // Usa a função findOrCreate do db.ts
        const chat = await db.chats.findOrCreate(user.id, receiverId);
        return NextResponse.json(chat);

    } catch (error: unknown) {
        const apiError = error as ApiError;
        console.error('Error creating/reactivating chat:', apiError);
        return NextResponse.json(
            { message: apiError.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}