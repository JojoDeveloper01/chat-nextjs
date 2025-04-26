import { createServer } from 'node:http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'cookie';
import { verify } from 'jsonwebtoken';
import { db } from './src/lib/db';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Map to store active connections
const activeConnections = new Map<string, Set<string>>();

app.prepare().then(() => {
    const server = createServer(handle);
    const io = new Server(server, {
        cors: {
            origin: "*",  // Permite conexões de qualquer origem
            methods: ["GET", "POST"],
            credentials: false  // Desabilitado pois não é compatível com origin: "*"
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie;
            if (!cookieHeader) return next(new Error('Authentication required'));

            const cookies = parse(cookieHeader);
            const token = cookies['auth-token'];
            if (!token) return next(new Error('Authentication required'));

            const decoded = verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
            socket.data.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.userId;

        // Emit connection status to all
        io.emit('user_connection', { userId, isOnline: true });

        // Manage active connections
        if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
        }
        activeConnections.get(userId)?.add(socket.id);

        // Join private room only if first connection
        if (activeConnections.get(userId)?.size === 1) {
            socket.join(userId);
            console.log('User connected:', userId);
        }

        socket.on("send_message", async (data) => {
            try {
                const { content, receiverId } = data;
                const userId = socket.data.userId;

                // 1. Find or create chat (ensuring it's unique)
                const chat = await db.chats.findOrCreate(userId, receiverId);

                // 2. Create message
                const message = await db.messages.create({
                    content,
                    chatId: chat.id,
                    senderId: userId
                });

                // 3. Find updated chat
                const updatedChat = await db.chats.findById(chat.id);

                if (!updatedChat) {
                    throw new Error('Failed to fetch updated chat');
                }

                // 4. Emit event with updated chat
                const eventData = {
                    message,
                    chat: updatedChat
                };

                // Emit to sender
                socket.emit('receive_message', eventData);

                // Emit to receiver
                io.to(receiverId).emit('receive_message', eventData);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on("delete_message", async (data) => {
            try {
                const { messageId, chatId } = data;
                const userId = socket.data.userId;

                // Find updated message with chat
                const deletedMessage = await db.messages.softDelete(messageId, userId);

                if (!deletedMessage) {
                    throw new Error('Failed to delete message');
                }

                // Find chat to get the other participant ID
                const chat = await db.chats.findById(chatId);
                if (chat) {
                    const receiverId = chat.userId === userId ? chat.receiverId : chat.userId;

                    // Emit to the one who deleted
                    socket.emit('message_deleted', {
                        messageId,
                        isSender: deletedMessage.senderId === userId
                    });

                    // Emit to the other participant (don't delete for them)
                    io.to(receiverId).emit('message_deleted', {
                        messageId,
                        isSender: deletedMessage.senderId === receiverId
                    });
                }
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        });

        socket.on("edit_message", async (data) => {
            try {
                const { messageId, chatId, content } = data;
                const updatedMessage = await db.messages.update({
                    messageId,
                    content
                });

                // Emit to the sender
                socket.emit('message_updated', updatedMessage);

                // Find the chat to get the other participant ID
                const chat = await db.chats.findById(chatId);  // Changed from findUnique to findById
                if (chat) {
                    const receiverId = chat.userId === socket.data.userId ? chat.receiverId : chat.userId;
                    // Emit to the receiver
                    io.to(receiverId).emit('message_updated', updatedMessage);
                }
            } catch (error) {
                console.error('Error editing message:', error);
            }
        });

        socket.on("delete_chat", async (data) => {
            try {
                const { chatId } = data;
                const userId = socket.data.userId;

                const chat = await db.chats.findById(chatId);
                if (!chat) {
                    return socket.emit('error', { message: 'Chat not found' });
                }

                const updatedChat = await db.chats.softDelete(chatId);

                if (updatedChat) {
                    // Emit only to the user who deleted the chat
                    socket.emit('chat_deleted', { chatId });
                }
            } catch (error) {
                console.error('Error deleting chat:', error);
                socket.emit('error', { message: 'Failed to delete chat' });
            }
        });

        socket.on('disconnect', () => {
            // Remove socket ID from user's connection list
            activeConnections.get(userId)?.delete(socket.id);

            // If no more connections, consider user disconnected
            if (activeConnections.get(userId)?.size === 0) {
                activeConnections.delete(userId);
                console.log('User fully disconnected:', userId);
                // Emit state of disconnection to all
                io.emit('user_connection', { userId, isOnline: false });
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server running at http://${hostname}:${port}`);
    });
});
