import { prisma } from './prisma';

export const db = {
    chats: {
        findAll: async (userId: string) => {
            return prisma.chat.findMany({
                where: {
                    OR: [
                        { userId },
                        { receiverId: userId }
                    ],
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
        },

        findById: async (chatId: string) => {
            // Remove a condição deletedForUser: false para permitir encontrar o chat mesmo que deletado
            return prisma.chat.findUnique({
                where: {
                    id: chatId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        },

        softDelete: async (chatId: string) => {
            return prisma.chat.update({
                where: { id: chatId },
                data: { deletedForUser: true }
            });
        },

        findOrCreate: async (userId: string, receiverId: string) => {
            const existingChat = await prisma.chat.findFirst({
                where: {
                    OR: [
                        { AND: [{ userId }, { receiverId }] },
                        { AND: [{ userId: receiverId }, { receiverId: userId }] }
                    ]
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    },
                    user: {
                        select: { id: true, name: true, email: true }
                    },
                    receiver: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });

            if (existingChat) {
                // Se encontrar, reativa o chat para ambos os usuários
                return prisma.chat.update({
                    where: { id: existingChat.id },
                    data: {
                        deletedForUser: false,
                        deletedForReceiver: false,
                    },
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        },
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        receiver: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                });
            }

            // Se não encontrar, cria um novo chat
            return prisma.chat.create({
                data: {
                    userId,
                    receiverId,
                    deletedForUser: false,
                    deletedForReceiver: false,
                },
                include: {
                    messages: true,
                    user: {
                        select: { id: true, name: true, email: true }
                    },
                    receiver: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
        }
    },

    messages: {
        create: async ({ content, chatId, senderId }: {
            content: string;
            chatId: string;
            senderId: string;
        }) => {
            return prisma.message.create({
                data: {
                    content,
                    chatId,
                    senderId,
                    deletedForSender: false,
                    deletedForReceiver: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        },

        update: async ({ messageId, content }: {
            messageId: string;
            content: string;
        }) => {
            return prisma.message.update({
                where: { id: messageId },
                data: { content },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        },

        softDelete: async (messageId: string, userId: string) => {
            const message = await prisma.message.findUnique({
                where: { id: messageId }
            });

            if (!message) {
                throw new Error('Message not found');
            }

            // Se o usuário é o remetente, marca como deletado para ele
            const isSender = message.senderId === userId;
            return prisma.message.update({
                where: { id: messageId },
                data: {
                    deletedForSender: isSender,
                    deletedForReceiver: !isSender
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
        }
    },

    users: {
        findByEmail: async (email: string) => {
            return prisma.user.findUnique({
                where: { email }
            });
        },

        findById: async (id: string) => {
            return prisma.user.findUnique({
                where: { id }
            });
        },

        create: async (data: {
            email: string;
            password: string;
            name?: string;
        }) => {
            return prisma.user.create({
                data: {
                    email: data.email,
                    password: data.password,
                    name: data.name || data.email.split('@')[0],
                }
            });
        },

        findAll: async () => {
            return prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            });
        }
    }
};