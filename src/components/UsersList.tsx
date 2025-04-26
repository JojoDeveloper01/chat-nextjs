import { useEffect, useState } from 'react';
import { useChatStore, type User } from '@/store/chatStore';

/**
 * Props for the UsersList component
 */
interface UsersListProps {
    /** ID of the current logged-in user */
    currentUserId: string;
    /** Callback function when a chat is started with another user */
    onStartChat: (otherUser: User) => void;
}

/**
 * UsersList Component
 * 
 * Displays a list of all users except the current user.
 * Features include:
 * - Real-time user list updates
 * - Loading states
 * - Empty state handling
 * - User avatars with initials
 * - Click to start chat functionality
 */
const UsersList: React.FC<UsersListProps> = ({ currentUserId, onStartChat }) => {
    const { users: globalUsers, setUsers } = useChatStore();
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetches the list of users from the API
     * Filters out the current user and updates the global store
     */
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/users');
                if (!response.ok) throw new Error('Failed to load users');
                const data = await response.json();
                // Filter out current user before updating the store
                const filteredData = data.filter((user: User) => user.id !== currentUserId);
                setUsers(filteredData);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [currentUserId, globalUsers.length, setUsers]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (globalUsers.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No users available</p>
            </div>
        );
    }

    // Filter out current user from the list
    const filteredUsers = globalUsers.filter(u => u.id !== currentUserId);

    return (
        <div className="overflow-hidden">
            <div className="space-y-1">
                {filteredUsers.map((otherUser) => (
                    <div
                        key={otherUser.id}
                        className="flex items-center justify-between px-3 py-5 shadow hover:bg-[#202c45] cursor-pointer"
                        onClick={() => onStartChat(otherUser)}
                    >
                        <div className="flex items-center min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white">
                                {otherUser.name?.[0] || otherUser.email[0]}
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="font-medium truncate">{otherUser.name}</p>
                                <p className="text-sm text-gray-500 truncate">{otherUser.email}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UsersList;