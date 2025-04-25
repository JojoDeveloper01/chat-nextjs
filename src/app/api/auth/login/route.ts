import { loginUser } from '@/lib/auth';
import { ApiError } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validação básica
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Login do User
        const user = await loginUser(email, password);

        return NextResponse.json(
            { message: 'Login realizado com sucesso', user },
            { status: 200 }
        );
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message || 'Credenciais inválidas' },
            { status: 401 }
        );
    }
}