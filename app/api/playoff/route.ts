import { NextRequest, NextResponse } from 'next/server'
import { getDb, isTursoConfigured, type DbRow } from '../../lib/db'

async function ensurePlayoffTable() {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS playoff_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL,
      game_key TEXT NOT NULL,
      score1 REAL,
      score2 REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(season_id, game_key)
    );
  `)
  return db
}

export async function GET(request: NextRequest) {
  if (!isTursoConfigured()) {
    return NextResponse.json({}, { status: 200 })
  }
  try {
    const seasonId = (request.nextUrl.searchParams.get('season') as string) || 'season6'
    const db = await ensurePlayoffTable()

    const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [
      seasonId,
    ])
    const seasonRow = (seasonResult.rows as DbRow[])[0]
    if (!seasonRow) return NextResponse.json({})

    const seasonDbId = seasonRow.id as number
    const r = await db.execute(
      'SELECT game_key, score1, score2 FROM playoff_scores WHERE season_id = ?',
      [seasonDbId]
    )

    const data: Record<string, { score1: number | null; score2: number | null }> = {}
    for (const row of r.rows as DbRow[]) {
      const key = String(row.game_key)
      data[key] = {
        score1: row.score1 != null ? (row.score1 as number) : null,
        score2: row.score2 != null ? (row.score2 as number) : null,
      }
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('GET /api/playoff error:', e)
    return NextResponse.json({ error: 'Failed to fetch playoff scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const { seasonId = 'season6', gameKey, score1, score2 } = body as {
      seasonId?: string
      gameKey?: string
      score1?: number | null
      score2?: number | null
    }

    if (!gameKey || typeof gameKey !== 'string') {
      return NextResponse.json({ error: 'gameKey is required' }, { status: 400 })
    }

    const db = await ensurePlayoffTable()

    const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [
      seasonId,
    ])
    const seasonRow = (seasonResult.rows as DbRow[])[0]
    if (!seasonRow) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 })
    }
    const seasonDbId = seasonRow.id as number

    const s1 = typeof score1 === 'number' && !Number.isNaN(score1) ? score1 : null
    const s2 = typeof score2 === 'number' && !Number.isNaN(score2) ? score2 : null

    await db.execute(
      `INSERT INTO playoff_scores (season_id, game_key, score1, score2, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(season_id, game_key) DO UPDATE SET
         score1 = excluded.score1,
         score2 = excluded.score2,
         updated_at = datetime('now')`,
      [seasonDbId, gameKey, s1, s2]
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('POST /api/playoff error:', e)
    return NextResponse.json({ error: 'Failed to save playoff score' }, { status: 500 })
  }
}

