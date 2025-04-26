interface ChatHeaderProps {
    receiver: {
        name?: string;
        email?: string;
    } | null;
    onDeleteChat: () => void;
    showDeleteButton?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ receiver, onDeleteChat, showDeleteButton = true }) => {
    return (
        <div className="px-4 py-[.6rem] border-b border-gray-500 flex items-center justify-between">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                    {receiver?.name?.charAt(0) || receiver?.email?.charAt(0)}
                </div>
                <h2 className="font-medium">{receiver?.name || receiver?.email}</h2>
            </div>
            {showDeleteButton && (
                <button
                    onClick={onDeleteChat}
                    className="text-[#ff6367] hover:underline"
                >
                    Delete Chat
                </button>
            )}
        </div>
    );
};

export default ChatHeader;