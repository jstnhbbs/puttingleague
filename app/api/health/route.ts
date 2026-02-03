import { NextResponse } from 'next/server'
import { isTursoConfigured, getDb } from '../../lib/db'

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { status: 'ok', database: 'not_configured', timestamp: new Date().toISOString() },
      { status: 200 }
    )
  }
  try {
    const db = getDb()
    await db.execute('SELECT 1')
    return NextResponse.json({
      status: 'ok',
      database: 'turso',
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Health check error:', e)
    return NextResponse.json(
      { status: 'error', database: 'turso', message: String(e) },
      { status: 503 }
    )
  }
}
