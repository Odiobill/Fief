import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from './lib/auth';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth for API routes (handled in route handlers)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const isLoginPage = pathname.includes('/login');
  const isDashboard = pathname.includes('/dashboard');
  const isAdminPage = pathname.includes('/admin');

  // If user is logged in
  if (session.tenantId || session.isAdmin) {
    if (isLoginPage) {
      const redirectUrl = session.isAdmin ? '/admin' : '/dashboard';
      // We need to handle locale in redirect, but intlMiddleware does a lot of it.
      // For simplicity, we'll let the user land on /login and then redirect.
      // But a better way is to redirect to the localized path.
      
      // Since we are in middleware, we can use request.nextUrl.locale if available
      // but App Router middleware is tricky with locales.
      
      // Let's just redirect and let the next middleware call handle the locale.
      const url = request.nextUrl.clone();
      url.pathname = session.isAdmin ? '/admin' : '/dashboard';
      return NextResponse.redirect(url);
    }
  } else {
    // If user is not logged in and trying to access protected page
    if (isDashboard || isAdminPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - _next (Next.js internals)
  // - _static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!_next|_static|_vercel|[\\w-]+\\.\\w+).*)', '/']
};
