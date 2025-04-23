import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        // Validação básica
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Criar User
        const user = await registerUser(email, password, name);

        return NextResponse.json(
            { message: 'User registrado com sucesso', user },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Erro ao registrar User' },
            { status: 400 }
        );
    }
}