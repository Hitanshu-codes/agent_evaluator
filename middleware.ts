import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'nudgeable_session'

const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/logout']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isProtectedDashboard = pathname.startsWith('/dashboard')
  const isProtectedSession = pathname.startsWith('/session')
  const isProtectedHistory = pathname.startsWith('/history')
  const isProtectedApi = pathname.startsWith('/api') && !PUBLIC_API_ROUTES.includes(pathname)
  
  const isProtectedRoute = isProtectedDashboard || isProtectedSession || isProtectedHistory || isProtectedApi

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)

  if (!sessionCookie) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/session/:path*',
    '/history/:path*',
    '/api/:path*',
  ],
}
