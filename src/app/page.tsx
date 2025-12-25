"use client";
import Link from 'next/link';
import { useChatStore } from '@/store/chatStore';

export default function HomePage() {
  const user = useChatStore((s) => s.user);
  const isLoading = useChatStore((s) => s.isLoading);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 text-center text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to NextJS Chat</h1>
      <p className="text-xl mb-8">A simple and efficient chat system</p>

      {isLoading ? (
        <p className="text-gray-400">Checking session...</p>
      ) : (
        <div className="flex gap-4">
          {user ? (
            <Link
              href="/chat"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
            >
              Go to Chat
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
