"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import { Message, Chat, User } from '@/store/chatStore';
import UsersList from '@/components/UsersList';
import ChatList from '@/components/ChatList';
import ChatHeader from '@/components/ChatHeader';
import MessageArea from '@/components/MessageArea';
import MessageInput from '@/components/MessageInput';

const ChatPage: React.FC = () => {
    const [input, setInput] = useState('');
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showUsers, setShowUsers] = useState(false);
    const [localChats, setLocalChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const socket = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
    const { user, setUserConnection, removeUserConnection } = useChatStore();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/user');
                const data = await response.json();

                if (!data.id) {
                    window.location.href = '/login';
                    return;
                }

                setIsLoading(false);
            } catch (error) {
                window.location.href = '/login';
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await fetch('/api/chats');
                if (response.ok) {
                    const chatsData = await response.json();
                    setLocalChats(chatsData);
                }
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        };

        if (user) {
            fetchChats();
        }
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        socket.on('receive_message', (message) => {
            setOptimisticMessages(prev =>
                prev.filter(m => m.content !== message.content)
            );

            setLocalChats(prevChats => {
                // Verifica se o chat já existe na lista
                const chatExists = prevChats.some(chat => chat.id === message.chatId);
                const updatedChats = chatExists
                    ? prevChats.map(chat => {
                        if (chat.id === message.chatId) {
                            return {
                                ...chat,
                                messages: [...chat.messages, message],
                                updatedAt: new Date()
                            };
                        }
                        return chat;
                    })
                    : [...prevChats, activeChat!]; // Adiciona o chat se for a primeira mensagem

                return updatedChats.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });

            if (activeChat?.id === message.chatId) {
                setActiveChat(prev => ({
                    ...prev!,
                    messages: [...prev!.messages, message],
                    updatedAt: new Date()
                }));

                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [socket, user, activeChat]);

    useEffect(() => {
        if (!socket || !user) return;

        // Listener para mensagens atualizadas (editadas)
        socket.on('message_updated', (updatedMessage) => {
            setLocalChats(prevChats => {
                const updatedChats = prevChats.map(chat => ({
                    ...chat,
                    messages: chat.messages.map(msg =>
                        msg.id === updatedMessage.id ? updatedMessage : msg
                    )
                }));
                return updatedChats;
            });

            if (activeChat) {
                setActiveChat(prev => ({
                    ...prev!,
                    messages: prev!.messages.map(msg =>
                        msg.id === updatedMessage.id ? updatedMessage : msg
                    )
                }));
            }
        });

        // Listener para mensagens deletadas
        socket.on('message_deleted', ({ messageId }) => {
            setLocalChats(prevChats => {
                const updatedChats = prevChats.map(chat => ({
                    ...chat,
                    messages: chat.messages.map(msg =>
                        msg.id === messageId
                            ? { ...msg, deletedForSender: true }
                            : msg
                    )
                }));
                return updatedChats;
            });

            if (activeChat) {
                setActiveChat(prev => ({
                    ...prev!,
                    messages: prev!.messages.map(msg =>
                        msg.id === messageId
                            ? { ...msg, deletedForSender: true }
                            : msg
                    )
                }));
            }
        });

        return () => {
            socket.off('message_updated');
            socket.off('message_deleted');
        };
    }, [socket, user, activeChat])

    useEffect(() => {
        if (!socket) return;

        socket.on('user_connection', ({ userId, isOnline }) => {
            if (isOnline) {
                setUserConnection(userId, true);
            } else {
                setUserConnection(userId, false);
            }
        });

        return () => {
            socket.off('user_connection');
        };
    }, [socket, setUserConnection]);

    useEffect(() => {
        if (!socket || !user) return;

        socket.on('chat_deleted', ({ chatId }) => {
            setLocalChats(prevChats =>
                prevChats.filter(chat => chat.id !== chatId)
            );

            if (activeChat?.id === chatId) {
                setActiveChat(null);
            }
        });

        return () => {
            socket.off('chat_deleted');
        };
    }, [socket, user, activeChat]);

    const handleSendMessage = () => {
        if (!input.trim() || !socket || !activeChat || !user) return;

        const messageContent = input.trim();
        setInput('');

        const optimisticMessage = {
            id: `temp-${Date.now()}-${Math.random()}`,
            content: messageContent,
            chatId: activeChat.id,
            senderId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            deletedForSender: false,
            deletedForReceiver: false
        };

        setOptimisticMessages(prev => [...prev, optimisticMessage]);

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 0);

        socket.emit('send_message', {
            chatId: activeChat.id,
            receiverId: activeChat.userId === user.id ? activeChat.receiverId : activeChat.userId,
            content: messageContent
        });
    };

    const handleDeleteMessage = (messageId: string) => {
        if (socket) {
            socket.emit('delete_message', {
                messageId,
                chatId: activeChat?.id
            });
        }
    };

    const handleEditMessage = (messageId: string, content: string) => {
        setEditingMessage(messageId);
        setEditText(content);
    };

    const handleSaveEdit = (messageId: string) => {
        if (socket) {
            socket.emit('edit_message', {
                messageId,
                chatId: activeChat?.id,
                content: editText
            });
        }
        setEditingMessage(null);
    };

    const handleDeleteChat = () => {
        if (!activeChat || !socket) return;

        socket.emit('delete_chat', {
            chatId: activeChat.id
        });

        setLocalChats(prevChats =>
            prevChats.filter(chat => chat.id !== activeChat.id)
        );
        setActiveChat(null);
    };

    const handleStartChat = async (otherUser: User) => {
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: otherUser.id }),
            });

            if (!response.ok) throw new Error('Failed to create chat');

            const chat = await response.json();

            // Só adiciona à lista de chats se houver mensagens
            if (chat.messages && chat.messages.length > 0) {
                setLocalChats(prevChats => {
                    const chatExists = prevChats.some(c => c.id === chat.id);
                    if (!chatExists) {
                        return [...prevChats, chat];
                    }
                    return prevChats.map(c => c.id === chat.id ? chat : c);
                });
            }

            setActiveChat(chat);
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const receiver = activeChat
        ? activeChat.userId === user?.id
            ? activeChat.receiver
            : activeChat.user
        : null;

    const allMessages = activeChat
        ? [...activeChat.messages, ...optimisticMessages]
            .filter((message, index, self) =>
                index === self.findIndex(m => m.id === message.id)
            )
            .sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            .filter(message => {
                const isOwn = message.senderId === user?.id;
                return !(isOwn && message.deletedForSender) &&
                    !(!isOwn && message.deletedForReceiver);
            })
        : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen ">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen ">
            {/* Sidebar */}
            <div className="w-1/4 border-r border-border text-text-primary">
                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        className={`flex-1 p-4 font-medium transition-colors
                            ${!showUsers ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setShowUsers(false)}
                    >
                        Chats
                    </button>
                    <button
                        className={`flex-1 p-4 font-medium transition-colors
                            ${showUsers ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setShowUsers(true)}
                    >
                        Usuários
                    </button>
                </div>

                {/* Lists */}
                {showUsers ? (
                    <UsersList
                        currentUserId={user?.id || ''}
                        onStartChat={handleStartChat}
                    />
                ) : (
                    <ChatList
                        chats={localChats}
                        activeChat={activeChat}
                        userId={user?.id || ''}
                        onChatSelect={setActiveChat}
                    />
                )}
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 bg-[#141a27]">
                {activeChat ? (
                    <>
                        <ChatHeader
                            receiver={receiver}
                            onDeleteChat={handleDeleteChat}
                            showDeleteButton={!showUsers}
                        />

                        <MessageArea
                            messages={allMessages}
                            userId={user?.id || ''}
                            onEditMessage={handleEditMessage}
                            onDeleteMessage={handleDeleteMessage}
                            editingMessage={editingMessage}
                            editText={editText}
                            setEditText={setEditText}
                            onSaveEdit={handleSaveEdit}
                            messagesEndRef={messagesEndRef}
                            setEditingMessage={setEditingMessage}
                        />

                        <MessageInput input={input} setInput={setInput} handleSendMessage={handleSendMessage} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-text-secondary">
                            <h3 className="text-xl font-medium">
                                Select a chat to start messaging
                            </h3>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
