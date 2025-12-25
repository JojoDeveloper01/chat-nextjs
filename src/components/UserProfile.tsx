import { User } from "@/store/chatStore";

export const UserProfile = ({ user, handleLogout }: { user: User | null, handleLogout: () => void }) => {
    return (
        <div className="absolute bottom-0 w-1/4 border-t border-r border-border p-4 bg-[#141a27]">
            <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                        {user?.name?.[0] || user?.email?.[0]}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="font-medium truncate text-text-primary">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-sm truncate text-text-secondary">
                            {user?.email || ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="ml-2 p-2 text-text-secondary hover:text-red-500 transition-colors"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 3a1 1 0 10-2 0v4a1 1 0 102 0V6zm-8 7a1 1 0 100 2h4a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};