import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();

        console.log('User:', user);

        if (!user) {
            return NextResponse.json(
                { message: 'Não autenticado' },
                { status: 401 }
            );
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Erro ao obter User' },
            { status: 500 }
        );
    }
}