import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be set to a strong value with at least 32 characters');
    }
    return secret;
}

function getCookieDomain() {
    return process.env.COOKIE_DOMAIN || undefined;
}

function withoutPassword<T extends { password?: string }>(user: T) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
}

export async function registerUser(email: string, password: string, name?: string) {
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 10);
    const user = await db.users.create({
        email,
        password: hashedPassword,
        name
    });

    return withoutPassword(user);
}

export async function loginUser(email: string, password: string) {
    const user = await db.users.findByEmail(email);
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
        throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = sign(
        { userId: user.id, email: user.email },
        getJwtSecret(),
        { expiresIn: '7d' }
    );

    // Save token in secure cookie
    (await cookies()).set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from strict to lax for better compatibility
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        domain: getCookieDomain()
    });

    return withoutPassword(user);
}

export async function getCurrentUser() {
    try {
        const token = (await cookies()).get('auth-token')?.value;
        if (!token) return null;

        const decoded = verify(token, getJwtSecret()) as { userId: string };
        const user = await db.users.findById(decoded.userId);

        if (!user) return null;

        return withoutPassword(user);
    } catch {
        return null;
    }
}

// Middleware for protected routes
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Not authorized');
    }
    return user;
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', '', {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: getCookieDomain(),
        maxAge: 0,
        expires: new Date(0)
    });
}
