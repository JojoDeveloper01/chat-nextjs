import { Chat } from "@/store/chatStore";

interface ChatListProps {
    chats: Chat[];
    activeChat: Chat | null;
    userId: string;
    onChatSelect: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChat, userId, onChatSelect }) => {
    // Remove chats duplicados baseado no ID do outro usuário
    const uniqueChats = chats.reduce((acc, current) => {
        const otherUserId = current.userId === userId ? current.receiverId : current.userId;
        const existingChat = acc.find(chat => {
            const existingOtherUserId = chat.userId === userId ? chat.receiverId : chat.userId;
            return existingOtherUserId === otherUserId;
        });

        if (!existingChat) {
            acc.push(current);
        }
        return acc;
    }, [] as Chat[]);

    // Filtra chats que têm mensagens válidas E não estão deletados
    const validChats = uniqueChats.filter(chat => {
        const isDeleted = chat.userId === userId ? chat.deletedForUser : chat.deletedForReceiver;

        // Verifica se há pelo menos uma mensagem não deletada
        const hasValidMessages = chat.messages.some(message => {
            const isMessageFromUser = message.senderId === userId;
            // Se a mensagem é do usuário, não mostra se estiver deletada para ele
            if (isMessageFromUser) {
                return !message.deletedForSender;
            }
            // Se a mensagem é de outro, não mostra se estiver deletada para o receptor
            return !message.deletedForReceiver;
        });

        return hasValidMessages && !isDeleted;
    });

    // Ordena por data da última mensagem válida
    const sortedChats = [...validChats].sort((a, b) => {
        const getLastValidMessage = (chat: Chat) => {
            return chat.messages
                .filter(msg => {
                    const isMessageFromUser = msg.senderId === userId;
                    return isMessageFromUser ? !msg.deletedForSender : !msg.deletedForReceiver;
                })
                .slice(-1)[0];
        };

        const lastMessageA = getLastValidMessage(a);
        const lastMessageB = getLastValidMessage(b);

        const aDate = lastMessageA?.createdAt || a.updatedAt;
        const bDate = lastMessageB?.createdAt || b.updatedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return (
        <div>
            {sortedChats.map((chat) => {
                const chatPartner = chat.userId === userId ? chat.receiver : chat.user;
                const lastValidMessage = chat.messages
                    .filter(msg => {
                        const isMessageFromUser = msg.senderId === userId;
                        return isMessageFromUser ? !msg.deletedForSender : !msg.deletedForReceiver;
                    })
                    .slice(-1)[0]?.content;

                return (
                    <div
                        key={chat.id}
                        className={`p-4 border-b border-gray-500 cursor-pointer hover:bg-[#202c45] 
                            ${activeChat?.id === chat.id ? 'bg-[#202c45]' : ''}`}
                        onClick={() => onChatSelect(chat)}
                    >
                        <div className="font-medium">{chatPartner.name || chatPartner.email}</div>
                        <div className="text-sm text-gray-500 truncate">{lastValidMessage}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;