"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const prisma_1 = require("./prisma");
exports.db = {
    chats: {
        findAll: async (userId) => {
            return prisma_1.prisma.chat.findMany({
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
        findById: async (chatId) => {
            // Remove a condição deletedForUser: false para permitir encontrar o chat mesmo que deletado
            return prisma_1.prisma.chat.findUnique({
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
        softDelete: async (chatId) => {
            return prisma_1.prisma.chat.update({
                where: { id: chatId },
                data: { deletedForUser: true }
            });
        },
        findOrCreate: async (userId, receiverId) => {
            const existingChat = await prisma_1.prisma.chat.findFirst({
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
                return prisma_1.prisma.chat.update({
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
            return prisma_1.prisma.chat.create({
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
        create: async ({ content, chatId, senderId }) => {
            return prisma_1.prisma.message.create({
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
        update: async ({ messageId, content }) => {
            return prisma_1.prisma.message.update({
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
        softDelete: async (messageId, userId) => {
            const message = await prisma_1.prisma.message.findUnique({
                where: { id: messageId }
            });
            if (!message) {
                throw new Error('Message not found');
            }
            // Se o usuário é o remetente, marca como deletado para ele
            const isSender = message.senderId === userId;
            return prisma_1.prisma.message.update({
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
        findByEmail: async (email) => {
            return prisma_1.prisma.user.findUnique({
                where: { email }
            });
        },
        findById: async (id) => {
            return prisma_1.prisma.user.findUnique({
                where: { id }
            });
        },
        create: async (data) => {
            return prisma_1.prisma.user.create({
                data: {
                    email: data.email,
                    password: data.password,
                    name: data.name || data.email.split('@')[0],
                }
            });
        },
        findAll: async () => {
            return prisma_1.prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            });
        }
    }
};
