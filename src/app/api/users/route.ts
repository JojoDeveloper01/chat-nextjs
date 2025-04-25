import { NextResponse } from 'next/server';
import { ApiError } from '@/types/errors';
import { db } from '@/lib/db';

export async function GET() {
    try {
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