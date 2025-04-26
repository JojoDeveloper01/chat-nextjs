import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

    // If no token and route is not public, redirect to login
    if (!token && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If token and route is public, redirect to chat
    if (token && isPublicRoute) {
        try {
            // Verify if token is valid
            await getCurrentUser();
            return NextResponse.redirect(new URL('/chat', request.url));
        } catch {
            // If token is invalid, remove cookie and continue to public route
            const response = NextResponse.next();
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
