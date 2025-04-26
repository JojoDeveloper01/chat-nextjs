import { createServer } from 'node:http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'cookie';
import { verify } from 'jsonwebtoken';
import { db } from './src/lib/db';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 5432;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Mapa para armazenar conexões ativas
const activeConnections = new Map<string, Set<string>>();

app.prepare().then(() => {
    const server = createServer(handle);
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5432",
            methods: ["GET", "POST"],
            credentials: true
        },
        // Adicionar configurações para manter conexão
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Middleware de autenticação
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

        // Emitir estado de conexão para todos
        io.emit('user_connection', { userId, isOnline: true });

        // Gerenciar conexões ativas
        if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
        }
        activeConnections.get(userId)?.add(socket.id);

        // Juntar à sala privada apenas se for primeira conexão
        if (activeConnections.get(userId)?.size === 1) {
            socket.join(userId);
            console.log('User connected:', userId);
        }

        socket.on("send_message", async (data) => {
            try {
                const { content, receiverId } = data;
                const userId = socket.data.userId;

                // 1. Encontra ou cria o chat (garantindo que seja único)
                const chat = await db.chats.findOrCreate(userId, receiverId);

                // 2. Cria a mensagem
                const message = await db.messages.create({
                    content,
                    chatId: chat.id,
                    senderId: userId
                });

                // 3. Busca o chat atualizado
                const updatedChat = await db.chats.findById(chat.id);

                if (!updatedChat) {
                    throw new Error('Failed to fetch updated chat');
                }

                // 4. Emite o evento com o chat atualizado
                const eventData = {
                    message,
                    chat: updatedChat
                };

                // Emite para o remetente
                socket.emit('receive_message', eventData);

                // Emite para o destinatário
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

                // Busca a mensagem atualizada com o chat
                const deletedMessage = await db.messages.softDelete(messageId, userId);

                if (!deletedMessage) {
                    throw new Error('Failed to delete message');
                }

                // Busca o chat para obter o ID do outro participante
                const chat = await db.chats.findById(chatId);
                if (chat) {
                    const receiverId = chat.userId === userId ? chat.receiverId : chat.userId;

                    // Emite para quem deletou
                    socket.emit('message_deleted', {
                        messageId,
                        isSender: deletedMessage.senderId === userId
                    });

                    // Emite para o outro participante (não deleta pra ele)
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

                // Emitir para o remetente
                socket.emit('message_updated', updatedMessage);

                // Buscar o chat para obter o ID do outro participante
                const chat = await db.chats.findById(chatId);  // Changed from findUnique to findById
                if (chat) {
                    const receiverId = chat.userId === socket.data.userId ? chat.receiverId : chat.userId;
                    // Emitir para o destinatário
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
            // Remover socket ID da lista de conexões do usuário
            activeConnections.get(userId)?.delete(socket.id);

            // Se não houver mais conexões, considerar usuário desconectado
            if (activeConnections.get(userId)?.size === 0) {
                activeConnections.delete(userId);
                console.log('User fully disconnected:', userId);
                // Emitir estado de desconexão para todos
                io.emit('user_connection', { userId, isOnline: false });
            }
        });
    });

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
