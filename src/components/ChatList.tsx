import { Chat } from "@/store/chatStore";

interface ChatListProps {
    chats: Chat[];
    activeChat: Chat | null;
    userId: string;
    onChatSelect: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChat, userId, onChatSelect }) => {
    // Filtra apenas chats que têm mensagens
    const chatsWithMessages = chats.filter(chat => chat.messages.length > 0);

    if (chatsWithMessages.length === 0) {
        return <div className="p-4 text-gray-500">No chats available</div>;
    }

    return (
        <div>
            {chatsWithMessages.map((chat) => {
                const chatPartner = chat.userId === userId ? chat.receiver : chat.user;
                const lastMessage = chat.messages.at(-1)?.content;

                return (
                    <div
                        key={chat.id}
                        className={`p-4 border-b border-gray-500 cursor-pointer hover:bg-[#202c45] 
                            ${activeChat?.id === chat.id ? 'bg-[#202c45]' : ''}`}
                        onClick={() => onChatSelect(chat)}
                    >
                        <div className="font-medium">{chatPartner.name || chatPartner.email}</div>
                        <div className="text-sm text-gray-500 truncate">{lastMessage}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;