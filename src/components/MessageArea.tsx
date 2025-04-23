import { Message } from "@/store/chatStore";
import MessageBubble from "./MessageBubble";

interface MessageAreaProps {
    messages: Message[];
    userId: string;
    onEditMessage: (messageId: string, content: string) => void;
    onDeleteMessage: (messageId: string) => void;
    editingMessage: string | null;
    editText: string;
    setEditText: (text: string) => void;
    onSaveEdit: (messageId: string) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    setEditingMessage: (messageId: string | null) => void;
}

const MessageArea: React.FC<MessageAreaProps> = ({
    messages,
    userId,
    onEditMessage,
    onDeleteMessage,
    editingMessage,
    editText,
    setEditText,
    onSaveEdit,
    messagesEndRef,
    setEditingMessage
}) => {
    return (
        <div className="flex-1 p-4 overflow-y-auto ">
            {messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                    Start a conversation
                </div>
            ) : (
                <div className="flex flex-col px-4 py-2">
                    {messages.map((message) => {
                        const isOwn = message.senderId === userId;
                        const isOptimistic = message.id.startsWith('temp-');

                        return (
                            <div key={message.id} className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {editingMessage === message.id ? (
                                    <div className="flex border border-gray-500">
                                        <input
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="flex-1 p-2"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    onSaveEdit(message.id);
                                                } else if (e.key === 'Escape') {
                                                    setEditingMessage(null);
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => onSaveEdit(message.id)}
                                            className="px-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M5 12l5 5l10 -10" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setEditingMessage(null)}
                                            className="px-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M18 6l-12 12" />
                                                <path d="M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <MessageBubble
                                        message={message}
                                        isOwn={isOwn}
                                        isOptimistic={isOptimistic}
                                        onEdit={onEditMessage}
                                        onDelete={onDeleteMessage}
                                    />
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
};

export default MessageArea;