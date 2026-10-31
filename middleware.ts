import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const { pathname } = req.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (host.startsWith('os.3jindustrialparts.com') && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/os';
    return NextResponse.rewrite(url);
  }

  if (host.startsWith('app.3jindustrialparts.com') && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
