import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
    try {
        await logoutUser();
        return NextResponse.json(
            { message: 'Logout realizado com sucesso' },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Erro ao fazer logout' },
            { status: 500 }
        );
    }
}