import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const user = await requireAuth();
        const chat = await db.chats.findById(params.chatId);

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
    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}