'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@/types/errors';

/**
 * LoginForm Component
 * 
 * A form component that handles user authentication. Features include:
 * - Email and password validation
 * - Error handling and display
 * - Success messages for registration completion
 * - Loading states for better UX
 * - Automatic redirection after login
 */
export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check if the user just registered
        if (searchParams?.get('registered') === 'true') {
            setSuccess('Registration completed successfully! Login to continue.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error logging in');
            }

            // Redirect to chat page after successful login
            router.replace('/chat');
            // Force a page reload to ensure everything is reset
            window.location.reload();
        } catch (error: unknown) {
            const err = error as ApiError;
            setError(err.message || 'Error logging in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 rounded-lg shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-6 text-center text-black">Login</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        className="w-full px-3 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Login'}
                </button>
            </form>

            <div className="mt-4 text-center text-black">
                <p>
                    Dont have an account?{' '} 
                    <Link href="/register" className="text-blue-500 hover:text-blue-600">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
