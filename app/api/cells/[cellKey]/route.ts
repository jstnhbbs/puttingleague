import { NextRequest, NextResponse } from 'next/server'
import {
  getDb,
  isTursoConfigured,
  cellKeyToRelational,
  type DbRow,
} from '../../../lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cellKey: string }> }
) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const { cellKey } = await params
    const seasonId = request.nextUrl.searchParams.get('season') || 'season6'

    const rel = cellKeyToRelational(cellKey, seasonId)
    if (!rel) {
      return NextResponse.json({ error: 'Invalid cellKey format' }, { status: 400 })
    }

    const db = getDb()
    const seasonR = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [seasonId])
    const seasonRow = (seasonR.rows as DbRow[])[0]
    const playerR = await db.execute('SELECT id FROM players WHERE name = ?', [rel.playerName])
    const playerRow = (playerR.rows as DbRow[])[0]
    if (!seasonRow || !playerRow) {
      return NextResponse.json({ error: 'Invalid season or player' }, { status: 400 })
    }
    const seasonDbId = seasonRow.id as number
    const playerId = playerRow.id as number

    let deleted = false
    if (rel.week != null) {
      const r = await db.execute(
        'DELETE FROM scores WHERE season_id = ? AND player_id = ? AND week = ?',
        [seasonDbId, playerId, rel.week]
      )
      deleted = (r.rowsAffected ?? 0) > 0
    } else if (rel.isTotal) {
      const r = await db.execute(
        'DELETE FROM calculated_scores WHERE season_id = ? AND player_id = ? AND calculation_type = ?',
        [seasonDbId, playerId, 'total']
      )
      deleted = (r.rowsAffected ?? 0) > 0
    } else if (rel.isTotalMinusTwoLowest) {
      const r = await db.execute(
        'DELETE FROM calculated_scores WHERE season_id = ? AND player_id = ? AND calculation_type = ?',
        [seasonDbId, playerId, 'total_minus_two_lowest']
      )
      deleted = (r.rowsAffected ?? 0) > 0
    }

    return NextResponse.json({ success: true, deleted })
  } catch (e) {
    console.error('DELETE /api/cells/[cellKey] error:', e)
    return NextResponse.json({ error: 'Failed to delete cell' }, { status: 500 })
  }
}
