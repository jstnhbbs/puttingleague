import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'puttingleague_admin_session'
const SESSION_TTL_SECONDS = 12 * 60 * 60

type AdminSessionPayload = {
  sub: 'admin'
  exp: number
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? null
}

export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null
}

export function isValidAdminPassword(password: string): boolean {
  const adminPassword = getAdminPassword()
  return Boolean(adminPassword && safeEqual(password, adminPassword))
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
}

export function createAdminSessionCookie(): string {
  const secret = getSessionSecret()
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET or NEXTAUTH_SECRET')
  }

  const payload: AdminSessionPayload = {
    sub: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  const secret = getSessionSecret()
  if (!secret || !cookieValue) return false

  const [encodedPayload, signature] = cookieValue.split('.')
  if (!encodedPayload || !signature) return false

  const expectedSignature = signPayload(encodedPayload, secret)
  if (!safeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload
    return payload.sub === 'admin' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request.cookies.get(COOKIE_NAME)?.value)
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Admin session required' }, { status: 401 })
}

export function setAdminSessionCookie(response: NextResponse, cookieValue: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
