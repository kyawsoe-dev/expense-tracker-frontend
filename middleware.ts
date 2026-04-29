import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin routes
  if (pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('adminAuthenticated')?.value;

    if (pathname === '/admin/login') {
      if (adminAuth === 'true') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (adminAuth !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
