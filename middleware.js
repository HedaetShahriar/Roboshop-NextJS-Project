import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/api/seller');
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  // Redirect unauthenticated to login with return URL
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  const role = token.role || 'customer';

  // Normalize /dashboard root to role home
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const url = req.nextUrl.clone();
    const home = role === 'admin' ? 'admin' : role === 'rider' ? 'rider' : 'seller';
    url.pathname = `/dashboard/${home}`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Role guards per area
  if ((pathname.startsWith('/dashboard/seller') || pathname.startsWith('/api/seller')) && !(role === 'seller' || role === 'admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith('/dashboard/rider') && !(role === 'rider' || role === 'admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/seller/:path*'],
};
