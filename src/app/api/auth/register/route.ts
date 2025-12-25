import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { ApiError } from '@/types/errors';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await registerUser(email, password, name);
        return NextResponse.json(
            { message: 'User registered successfully', user },
            { status: 201 }
        );
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message || 'Failed to register User' },
            { status: 400 }
        );
    }
}