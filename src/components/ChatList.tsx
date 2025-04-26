import { Chat } from "@/store/chatStore";

interface ChatListProps {
    chats: Chat[];
    activeChat: Chat | null;
    userId: string;
    onChatSelect: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeChat, userId, onChatSelect }) => {
    // Remove duplicate chats based on the other user's ID
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

    // Filters chats that have valid messages AND are not deleted
    const validChats = uniqueChats.filter(chat => {
        const isDeleted = chat.userId === userId ? chat.deletedForUser : chat.deletedForReceiver;

        // Checks if there is at least one non-deleted message
        const hasValidMessages = chat.messages.some(message => {
            const isMessageFromUser = message.senderId === userId;
            // If the message is from the user, don't show if it's deleted for the user
            if (isMessageFromUser) {
                return !message.deletedForSender;
            }
            // If the message is from another user, don't show if it's deleted for the receiver
            return !message.deletedForReceiver;
        });

        return hasValidMessages && !isDeleted;
    });

    // Sorts by last valid message date
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