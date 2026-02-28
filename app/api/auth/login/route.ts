import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrCreateUser } from '@/lib/auth'

const COOKIE_NAME = 'nudgeable_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const usersEnv = process.env.USERS
    if (!usersEnv) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      )
    }

    const validUsers = usersEnv.split(',').map(pair => {
      const [u, p] = pair.split(':')
      return { username: u.trim(), password: p.trim() }
    })

    const matchedUser = validUsers.find(
      u => u.username === username && u.password === password
    )

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    await getOrCreateUser(username)

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
