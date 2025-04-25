import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';
import { ApiError } from '@/types/errors';

export async function POST() {
    try {
        await logoutUser();
        return NextResponse.json(
            { message: 'Logout realizado com sucesso' },
            { status: 200 }
        );
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message || 'Erro ao fazer logout' },
            { status: 500 }
        );
    }
}