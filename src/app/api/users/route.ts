import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            }
        });

        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 401 }
        );
    }
}