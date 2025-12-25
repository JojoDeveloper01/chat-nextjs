import { loginUser } from '@/lib/auth';
import { ApiError } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Basic validation
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // User Login
        const user = await loginUser(email, password);

        return NextResponse.json(
            { message: 'Login successful', user },
            { status: 200 }
        );
    } catch (error: unknown) {
        const apiError = error as ApiError;
        return NextResponse.json(
            { message: apiError.message || 'Invalid credentials' },
            { status: 401 }
        );
    }
}