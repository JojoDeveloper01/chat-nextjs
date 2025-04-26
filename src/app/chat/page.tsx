"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import { Message, Chat, User } from '@/store/chatStore';
import UsersList from '@/components/UsersList';
import ChatList from '@/components/ChatList';
import ChatHeader from '@/components/ChatHeader';
import MessageArea from '@/components/MessageArea';
import MessageInput from '@/components/MessageInput';
import { UserProfile } from '@/components/UserProfile';

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

    const socketUrl = typeof window !== 'undefined' ? 
        (process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin) : 
        'http://localhost:3000';
    const socket = useSocket(socketUrl);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const { user, setUserConnection, setUser } = useChatStore();

    // Monitor the socket connection state
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('Socket connected!');
            setIsSocketConnected(true);
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected!');
            setIsSocketConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // If already connected
        if (socket.connected) {
            setIsSocketConnected(true);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

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
            } catch {
                window.location.href = '/login';
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }
                
                const userData = await response.json();
                setUser(userData);
                // Now that we have the user, we can start the socket
                if (socket) {
                    socket.connect();
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                // If there is an error fetching the user, redirect to login
                window.location.href = '/login';
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();

    }, [setUser, socket]);

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

        // Listener for received messages
        socket.on('receive_message', async ({ message, chat }) => {
            setOptimisticMessages(prev =>
                prev.filter(m => m.content !== message.content)
            );

            setLocalChats(prev => {
                const chatExists = prev.some(c => c.id === chat.id);

                if (chatExists) {
                    // Update the existing chat with all messages from the updated chat
                    return prev.map(c => c.id === chat.id ? chat : c);
                } else {
                    // Add the new chat
                    return [chat, ...prev];
                }
            });

            // If it's the active chat, update with all messages
            if (activeChat?.id === chat.id) {
                setActiveChat(chat);
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [socket, user, activeChat]);

    useEffect(() => {
        if (!socket || !user) return;

        // Listener for updated messages (edited)
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

        // Listener for deleted messages
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

        // Update locally before server
        setLocalChats(prev => {
            return prev.map(chat => {
                if (chat.id === activeChat.id) {
                    return {
                        ...chat,
                        messages: [...chat.messages, optimisticMessage]
                    };
                }
                return chat;
            });
        });

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
                content: editText,
                isEdited: true
            });

            // Update local state optimistically
            setLocalChats(prevChats => {
                return prevChats.map(chat => {
                    if (chat.id === activeChat?.id) {
                        return {
                            ...chat,
                            messages: chat.messages.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, content: editText, isEdited: true }
                                    : msg
                            )
                        };
                    }
                    return chat;
                });
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

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                // Desconecta o socket antes de redirecionar
                if (socket) {
                    socket.disconnect();
                }
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const handleStartChat = async (otherUser: User) => {
        try {
            // Clear optimistic messages when changing chat
            setOptimisticMessages([]);

            const existingChat = localChats.find(chat =>
                (chat.userId === otherUser.id && chat.receiverId === user?.id) ||
                (chat.userId === user?.id && chat.receiverId === otherUser.id)
            );

            if (existingChat) {
                // Find the most updated chat in localChats
                const updatedChat = localChats.find(c => c.id === existingChat.id);
                if (updatedChat) {
                    setActiveChat(updatedChat);
                } else {
                    setActiveChat(existingChat);
                }
                return;
            }

            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: otherUser.id }),
            });

            if (!response.ok) throw new Error('Failed to create chat');

            const chat = await response.json();

            setLocalChats(prevChats => {
                // Remove duplicate chats before adding the new one
                const uniqueChats = prevChats.filter(c =>
                    !(c.userId === chat.userId && c.receiverId === chat.receiverId) &&
                    !(c.userId === chat.receiverId && c.receiverId === chat.userId)
                );
                return [chat, ...uniqueChats];
            });

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

    const allMessages = useMemo(() =>
        activeChat
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
            : [],
        [activeChat, optimisticMessages, user?.id]
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    // Show loading screen while loading or waiting for socket connection
    if (isLoading || !isSocketConnected) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">{isLoading ? 'Loading...' : 'Connecting to chat...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen ">
            {/* Sidebar */}
            <aside className="w-1/4 border-r border-border text-text-primary">
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
                        Users
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

                <UserProfile handleLogout={handleLogout} user={user} />
            </aside>

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
