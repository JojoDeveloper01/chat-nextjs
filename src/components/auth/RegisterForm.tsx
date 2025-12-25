'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@/types/errors';

/**
 * RegisterForm Component
 * 
 * Handles new user registration with features:
 * - Email and password validation
 * - Optional name field
 * - Error handling and display
 * - Loading states for better UX
 * - Automatic redirection to login after successful registration
 */
export default function RegisterForm() {
    // State variables to store user input
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the router instance from Next.js
    const router = useRouter();

    /**
     * Handles form submission
     * 
     * Sends a POST request to the /api/auth/register endpoint with user input
     * and handles the response accordingly
     */
    const handleSubmit = async (e: React.FormEvent) => {
        // Prevent default form submission behavior
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Send a POST request to the /api/auth/register endpoint
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            // Get the response data
            const data = await response.json();

            // Check if the response was successful
            if (!response.ok) {
                // Throw an error if the response was not successful
                throw new Error(data.message || 'Registration failed');
            }

            // Redirect the user to the login page after successful registration
            router.push('/login?registered=true');
        } catch (error: unknown) {
            // Catch any errors that occur during the registration process
            const err = error as ApiError;
            setError(err.message || 'Registration failed');
        } finally {
            // Set the loading state to false after the registration process is complete
            setLoading(false);
        }
    };

    return (
        // Container element for the registration form
        <div className="w-full max-w-md mx-auto p-6 rounded-lg shadow-md bg-white">
            {/* Form title */}
            <h2 className="text-2xl font-bold mb-6 text-center text-black">Create Account</h2>

           {/*  // Display any error messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Registration form */}
            <form onSubmit={handleSubmit}>
                {/* Name input field (optional) */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Name (optional)
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Email input field */}
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

                {/* Password input field */}
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
                        minLength={6}
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Create Account'}
                </button>
            </form>

            {/* Link to login page */}
            <div className="mt-4 text-center text-black">
                <p>
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-500 hover:text-blue-600">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}