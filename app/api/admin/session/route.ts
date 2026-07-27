import { NextRequest, NextResponse } from 'next/server'
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminPassword,
  isAdminRequest,
  isValidAdminPassword,
  setAdminSessionCookie,
} from '../../../lib/adminSession'

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) })
}

export async function POST(request: NextRequest) {
  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin password is not configured' }, { status: 500 })
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null
  if (!body?.password || !isValidAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  try {
    const response = NextResponse.json({ authenticated: true })
    setAdminSessionCookie(response, createAdminSessionCookie())
    return response
  } catch (error) {
    console.error('Failed to create admin session:', error)
    return NextResponse.json({ error: 'Admin session is not configured' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  clearAdminSessionCookie(response)
  return response
}
