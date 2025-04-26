import React from 'react';

const NotAuthenticatedPage: React.FC<{ errorMessage?: string }> = ({ errorMessage }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="p-8 rounded-lg shadow-md w-full max-w-md text-center text-black">
            <h2 className="text-2xl font-bold mb-4">Please login to access the chat</h2>
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                onClick={() => (window.location.href = '/login')}
            >
                Go to Login
            </button>
        </div>
    </div>
);

export default NotAuthenticatedPage;
