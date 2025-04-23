import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
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
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Credenciais inválidas' },
            { status: 401 }
        );
    }
}