import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/staff')) {
    // Permitimos /staff/login sin token
    if (pathname.startsWith('/staff/login')) return NextResponse.next();

    const token = req.cookies.get('staff_token')?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/staff/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/staff/:path*'],
};
