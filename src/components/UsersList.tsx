import { useEffect } from 'react';
import { useChatStore, type User } from '@/store/chatStore';

interface UsersListProps {
    currentUserId: string;
    onStartChat: (otherUser: User) => void;
}

const UsersList: React.FC<UsersListProps> = ({ currentUserId, onStartChat }) => {
    const { users: globalUsers, setUsers } = useChatStore();

    useEffect(() => {
        const fetchUsers = async () => {
            // If we already have users in the global store, don't fetch again
            if (globalUsers.length > 0) {
                return;
            }

            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                // Update global store
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [currentUserId, globalUsers.length, setUsers]);

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