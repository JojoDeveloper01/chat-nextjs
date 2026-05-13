import { NextResponse } from 'next/server';
import { ApiError } from '@/types/errors';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        await requireAuth();
        const users = await db.users.findAll();
        return NextResponse.json(users);
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message },
            { status: 401 }
        );
    }
}
