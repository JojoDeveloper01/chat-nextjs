import React from 'react';

interface DeleteMessageProps {
    message: { id: string };
    onDelete: (id: string) => void;
    setShowDeleteModal: (show: boolean) => void;
}

const DeleteMessage: React.FC<DeleteMessageProps> = ({ message, onDelete, setShowDeleteModal }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#202c45] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold mb-2">
                    Delete Message
                </h3>
                <p className="mb-6">
                    Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 text-sm font-medium hover:bg-gray-100 hover:text-gray-600 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onDelete(message.id);
                            setShowDeleteModal(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMessage;