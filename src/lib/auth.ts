import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Use object destructuring without creating unused variables
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
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
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Save token in secure cookie
    (await cookies()).set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from strict to lax for better compatibility
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined // Add domain for production
    });

    // Use object destructuring without creating unused variables
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export async function getCurrentUser() {
    try {
        const token = (await cookies()).get('auth-token')?.value;
        if (!token) return null;

        const decoded = verify(token, JWT_SECRET) as { userId: string };
        const user = await db.users.findById(decoded.userId);

        if (!user) return null;

        // Use object destructuring without creating unused variables
        const { ...userWithoutPassword } = user;
        return userWithoutPassword;
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
        domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined,
        maxAge: 0,
        expires: new Date(0)
    });
}