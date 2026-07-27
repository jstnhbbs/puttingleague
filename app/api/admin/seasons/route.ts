import { NextRequest, NextResponse } from 'next/server'
import { getDb, getPlayers, getSeasonsWithPlayers, isTursoConfigured } from '../../../lib/db'
import { isAdminRequest, unauthorizedResponse } from '../../../lib/adminSession'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const db = getDb()
    const [seasons, players] = await Promise.all([getSeasonsWithPlayers(db), getPlayers(db)])
    return NextResponse.json({ seasons, players })
  } catch (error) {
    console.error('GET /api/admin/seasons error:', error)
    return NextResponse.json({ error: 'Failed to load seasons' }, { status: 500 })
  }
}
