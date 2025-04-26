import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ApiError } from '@/types/errors';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { message: 'Não autenticado' },
                { status: 401 }
            );
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message || 'Erro ao obter User' },
            { status: 500 }
        );
    }
}