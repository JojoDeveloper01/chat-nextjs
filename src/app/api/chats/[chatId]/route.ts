import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ApiError } from '@/types/errors';


export async function GET(
    request: NextRequest,
    context: any
) {
    try {
        const user = await requireAuth();
        const chat = await db.chats.findById(context.params.chatId);

        if (!chat) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        // Garante que o usuário tem acesso ao chat
        if (chat.userId !== user.id && chat.receiverId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json(chat);
    } catch (error: unknown) {
        const apiError = error as ApiError;
        console.error('Error fetching chat:', apiError);
        return NextResponse.json(
            { error: apiError.message || 'Internal server error' },
            { status: 500 }
        );
    }
}