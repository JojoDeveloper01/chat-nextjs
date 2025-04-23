import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const chats = await prisma.chat.findMany({
            where: {
                deletedForUser: false
            },
            include: {
                messages: true,
                user: {
                    select: { id: true, name: true, email: true }
                },
                receiver: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(chats);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const { receiverId } = await request.json();

        // Procura por um chat existente (incluindo deletados)
        const existingChat = await prisma.chat.findFirst({
            where: {
                OR: [
                    {
                        AND: [
                            { userId: user.id },
                            { receiverId: receiverId }
                        ]
                    },
                    {
                        AND: [
                            { userId: receiverId },
                            { receiverId: user.id }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (existingChat) {
            // Se o chat existe, reativa-o para o usuário atual
            const updatedChat = await prisma.chat.update({
                where: { id: existingChat.id },
                data: {
                    deletedForUser: existingChat.userId === user.id ? false : existingChat.deletedForUser,
                    deletedForReceiver: existingChat.receiverId === user.id ? false : existingChat.deletedForReceiver,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });

            return NextResponse.json(updatedChat);
        }

        // Se não existe, cria um novo chat
        const newChat = await prisma.chat.create({
            data: {
                userId: user.id,
                receiverId: receiverId,
                deletedForUser: false,
                deletedForReceiver: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                messages: true
            }
        });

        return NextResponse.json(newChat);
    } catch (error: any) {
        console.error('Error creating/reactivating chat:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}