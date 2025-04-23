import { prisma } from './prisma';

export const db = {
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
                    isEdited: false,
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
                data: {
                    content,
                    isEdited: true
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

        delete: async (messageId: string) => {
            return prisma.message.update({
                where: { id: messageId },
                data: { deletedForSender: true }
            });
        },

        findUnique: async (messageId: string) => {
            return prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    chat: {
                        select: {
                            id: true,
                            userId: true,
                            receiverId: true
                        }
                    }
                }
            });
        },

        softDelete: async (messageId: string, userId: string) => {
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    chat: true
                }
            });

            if (!message) return null;

            return prisma.message.update({
                where: { id: messageId },
                data: {
                    deletedForSender: message.senderId === userId,
                    deletedForReceiver: message.chat.receiverId === userId
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

    chats: {
        findById: async (chatId: string) => {
            return prisma.chat.findFirst({
                where: {
                    id: chatId,
                    deletedForUser: false
                },
                include: {
                    messages: true,
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
        }
    }
};