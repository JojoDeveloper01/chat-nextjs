import { Message } from "@/store/chatStore";
import { useState } from "react";
import DeleteMessage from "./DeleteMessage";

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    isOptimistic: boolean;
    onEdit: (messageId: string, content: string) => void;
    onDelete: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwn,
    isOptimistic,
    onEdit,
    onDelete
}) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    return (
        <div className="relative group flex items-center gap-2">
            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <DeleteMessage message={message} onDelete={onDelete} setShowDeleteModal={setShowDeleteModal} />
            )}

            {/* Action buttons that appear on hover */}
            {isOwn && !isOptimistic && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3 shrink-0">
                    <button
                        onClick={() => onEdit(message.id, message.content)}
                        className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Message bubble */}
            <div
                className={`max-w-lg px-4 py-2 rounded-lg
                    ${isOwn ? 'bg-blue-500 text-white' : 'border border-gray-500'}
                    ${isOptimistic ? 'opacity-70' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <div>{message.content}</div>
                    {message.isEdited && (
                        <span className="text-xs opacity-70">Edited</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;