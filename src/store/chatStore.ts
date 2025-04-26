// src/store/chatStore.ts
import { create } from 'zustand';
import { Socket } from 'socket.io-client';

// Tipos
export interface User {
    id: string;
    email: string;
    name?: string;
}

export interface Message {
    id: string;
    content: string;
    chatId: string;
    senderId: string;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    deletedForSender: boolean;
    deletedForReceiver: boolean;
}

export interface Chat {
    id: string;
    userId: string;
    receiverId: string;
    user: User;
    receiver: User;
    messages: Message[];
    deletedForUser: boolean;
    deletedForReceiver: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserConnection {
    userId: string;
    isOnline: boolean;
    lastSeen?: Date;
}

interface ChatState {
    // Estado
    user: User | null;
    chats: Chat[];
    activeChat: Chat | null;
    socketStore: Socket | null;
    users: User[];
    isLoading: boolean;
    error: string | null;
    isInitialized?: boolean;
    connectedUsers: Map<string, UserConnection>;

    // Ações
    setUser: (user: User | null) => void;
    setSocketStore: (socketStore: Socket | null) => void;
    setChats: (chats: Chat[]) => void;
    setActiveChat: (chat: Chat | null) => void;
    setUsers: (users: User[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    // Operações de chat
    addChat: (chat: Chat) => void;
    removeChat: (chatId: string) => void;
    updateChat: (chat: Chat) => void;
    deleteChat: (chatId: string) => void;

    // Operações de mensagens
    addMessage: (message: Message) => void;
    updateMessage: (message: Message) => void;
    markMessageAsDeleted: (messageId: string, isSender: boolean) => void;
    deleteMessage: (messageId: string) => void;
    editMessage: (messageId: string, content: string) => void;

    // Ações de conexão
    setUserConnection: (userId: string, isOnline: boolean) => void;
    removeUserConnection: (userId: string) => void;

    // Reset
    reset: () => void;
}

// Estado inicial
const initialState = {
    chats: [],
    activeChat: null,
    socketStore: null,
    users: [],
    isLoading: false,
    error: null,
    connectedUsers: new Map<string, UserConnection>(),
};

// Criar store
export const useChatStore = create<ChatState>((set) => ({
    // Estado inicial
    user: null,
    ...initialState,

    // Ações
    setUser: (user) => set({ user, isInitialized: true }),
    setSocketStore: (socketStore) => set({ socketStore }),
    setChats: (chats) => set({ chats }),
    setActiveChat: (activeChat) => set({ activeChat }),
    setUsers: (users) => set({ users }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Operações de chat
    addChat: (chat) => set((state) => {
        // Check if a chat with same participants already exists
        const existingChat = state.chats.find(c =>
            (c.userId === chat.userId && c.receiverId === chat.receiverId) ||
            (c.userId === chat.receiverId && c.receiverId === chat.userId)
        );

        if (existingChat) {
            // If chat exists, just update its deletedForUser flag to false
            return {
                chats: state.chats.map(c =>
                    c.id === existingChat.id
                        ? { ...c, deletedForUser: false }
                        : c
                ),
                activeChat: existingChat
            };
        }

        // If chat doesn't exist, add it
        return {
            chats: [...state.chats, chat],
            activeChat: chat
        };
    }),
    removeChat: (chatId) => set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
        activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
    })),
    updateChat: (updatedChat) => set((state) => ({
        chats: state.chats.map((chat) =>
            chat.id === updatedChat.id ? updatedChat : chat
        ),
        activeChat: state.activeChat?.id === updatedChat.id ? updatedChat : state.activeChat,
    })),
    deleteChat: (chatId) =>
        set((state) => ({
            chats: state.chats.filter(chat => chat.id !== chatId),
            activeChat: state.activeChat?.id === chatId ? null : state.activeChat
        })),

    // Operações de mensagens
    addMessage: (message) => set((state) => {
        const updatedChats = state.chats.map((chat) =>
            chat.id === message.chatId
                ? { ...chat, messages: [...chat.messages, message] }
                : chat
        );

        const updatedActiveChat = state.activeChat?.id === message.chatId
            ? { ...state.activeChat, messages: [...state.activeChat.messages, message] }
            : state.activeChat;

        return { chats: updatedChats, activeChat: updatedActiveChat };
    }),
    updateMessage: (updatedMessage) => set((state) => {
        const updatedChats = state.chats.map((chat) =>
            chat.id === updatedMessage.chatId
                ? {
                    ...chat,
                    messages: chat.messages.map((msg) =>
                        msg.id === updatedMessage.id ? updatedMessage : msg
                    ),
                }
                : chat
        );

        const updatedActiveChat = state.activeChat?.id === updatedMessage.chatId
            ? {
                ...state.activeChat,
                messages: state.activeChat.messages.map((msg) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                ),
            }
            : state.activeChat;

        return { chats: updatedChats, activeChat: updatedActiveChat };
    }),
    markMessageAsDeleted: (messageId, isSender) => set((state) => {
        const updatedChats = state.chats.map((chat) => ({
            ...chat,
            messages: chat.messages.map((msg) =>
                msg.id === messageId
                    ? {
                        ...msg,
                        deletedForSender: isSender ? true : msg.deletedForSender,
                        deletedForReceiver: !isSender ? true : msg.deletedForReceiver,
                    }
                    : msg
            ),
        }));

        const updatedActiveChat = state.activeChat
            ? {
                ...state.activeChat,
                messages: state.activeChat.messages.map((msg) =>
                    msg.id === messageId
                        ? {
                            ...msg,
                            deletedForSender: isSender ? true : msg.deletedForSender,
                            deletedForReceiver: !isSender ? true : msg.deletedForReceiver,
                        }
                        : msg
                ),
            }
            : state.activeChat;

        return { chats: updatedChats, activeChat: updatedActiveChat };
    }),
    deleteMessage: (messageId) =>
        set((state) => ({
            chats: state.chats.map(chat => ({
                ...chat,
                messages: chat.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, deletedForSender: true }
                        : msg
                )
            }))
        })),
    editMessage: (messageId, content) =>
        set((state) => ({
            chats: state.chats.map(chat => ({
                ...chat,
                messages: chat.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, content, isEdited: true }
                        : msg
                )
            }))
        })),

    // Ações de conexão
    setUserConnection: (userId, isOnline) =>
        set((state) => {
            const newConnectedUsers = new Map(state.connectedUsers);
            newConnectedUsers.set(userId, {
                userId,
                isOnline,
                lastSeen: isOnline ? new Date() : undefined
            });

            return { connectedUsers: newConnectedUsers };
        }),

    removeUserConnection: (userId) =>
        set((state) => {
            const newConnectedUsers = new Map(state.connectedUsers);
            newConnectedUsers.delete(userId);
            return { connectedUsers: newConnectedUsers };
        }),

    // Resetar o estado
    reset: () => set(() => ({ ...initialState })),
}));
