import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Funções para autenticação
export async function registerUser(email: string, password: string, name?: string) {
    // Verificar se o User já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User já existe');
    }

    // Hash da senha e criação do User
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || email.split('@')[0], // Nome padrão baseado no email
        },
    });

    // Remover senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export async function loginUser(email: string, password: string) {
    // Buscar User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
        throw new Error('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Salvar token em cookie seguro
    (await
        // Salvar token em cookie seguro
        cookies()).set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 dias
            path: '/',
        });

    // Remover senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export async function logoutUser() {
    (await cookies()).delete('auth-token');
    return { success: true };
}

export async function getCurrentUser() {
    try {
        const token = (await cookies()).get('auth-token')?.value;
        if (!token) return null;

        // Verificar token
        const decoded = verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) return null;

        // Remover senha do objeto retornado
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        return null;
    }
}

// Middleware para rotas protegidas
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Não autorizado');
    }
    return user;
}