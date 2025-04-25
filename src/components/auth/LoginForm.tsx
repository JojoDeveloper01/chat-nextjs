'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ApiError } from '@/types/errors';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Verificar se o User acabou de se registrar
        if (searchParams?.get('registered') === 'true') {
            setSuccess('Registro concluído com sucesso! Faça login para continuar.');
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
                throw new Error(data.message || 'Erro ao fazer login');
            }

            // Redirecionar para a página de chat após login bem-sucedido
            router.push('/chat');
        } catch (error: unknown) {
            const err = error as ApiError;
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 rounded-lg shadow-md">
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
                        Senha
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
                    {loading ? 'Processando...' : 'Entrar'}
                </button>
            </form>

            <div className="mt-4 text-center text-black">
                <p>
                    Não tem uma conta?{' '}
                    <Link href="/register" className="text-blue-500 hover:text-blue-600">
                        Registre-se
                    </Link>
                </p>
            </div>
        </div>
    );
}