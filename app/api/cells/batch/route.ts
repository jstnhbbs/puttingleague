import { NextRequest, NextResponse } from 'next/server'
import {
  getDb,
  isTursoConfigured,
  cellKeyToRelational,
  ensureSeasonCatalog,
  getSeasonSummary,
  CURRENT_SEASON_ID,
  type DbRow,
} from '../../../lib/db'
import { isAdminRequest, unauthorizedResponse } from '../../../lib/adminSession'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorizedResponse()
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const seasonId = (body.seasonId as string) || CURRENT_SEASON_ID
    const cells = body.cells as Record<string, { value?: string; isFormula?: boolean }> | undefined
    if (!cells || typeof cells !== 'object') {
      return NextResponse.json({ error: 'cells object is required' }, { status: 400 })
    }

    const db = getDb()
    await ensureSeasonCatalog(db)
    const seasonR = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [seasonId])
    const seasonRow = (seasonR.rows as DbRow[])[0]
    if (!seasonRow) {
      return NextResponse.json({ error: `Invalid season: ${seasonId}` }, { status: 400 })
    }
    const seasonDbId = seasonRow.id as number
    const season = await getSeasonSummary(db, seasonId)
    const dropLowestCount = season?.dropLowestCount ?? 2

    const playersToRecalculate = new Set<number>()

    for (const [cellKey, cell] of Object.entries(cells)) {
      const rel = await cellKeyToRelational(db, cellKey, seasonId)
      if (!rel) continue

      const pr = await db.execute('SELECT id FROM players WHERE name = ?', [rel.playerName])
      const playerRow = (pr.rows as DbRow[])[0]
      if (!playerRow) continue
      const playerId = playerRow.id as number

      if (rel.week != null) {
        const scoreVal = cell.value ? parseFloat(cell.value) : null
        await db.execute(
          `INSERT INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(season_id, player_id, week) DO UPDATE SET
             score = excluded.score,
             is_formula = excluded.is_formula,
             formula_text = excluded.formula_text,
             updated_at = datetime('now')`,
          [
            seasonDbId,
            playerId,
            rel.week,
            scoreVal,
            cell.isFormula ? 1 : 0,
            cell.isFormula ? cell.value ?? null : null,
          ]
        )
        playersToRecalculate.add(playerId)
      } else if (rel.isTotal) {
        const v = parseFloat(cell.value ?? '0') || 0
        await db.execute(
          `INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
           VALUES (?, ?, 'total', ?, datetime('now'))
           ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET value = excluded.value, calculated_at = datetime('now')`,
          [seasonDbId, playerId, v]
        )
      } else if (rel.isTotalMinusTwoLowest) {
        const v = parseFloat(cell.value ?? '0') || 0
        await db.execute(
          `INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
           VALUES (?, ?, 'total_minus_two_lowest', ?, datetime('now'))
           ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET value = excluded.value, calculated_at = datetime('now')`,
          [seasonDbId, playerId, v]
        )
      }
    }

    for (const playerId of Array.from(playersToRecalculate)) {
      const scoresR = await db.execute(
        `SELECT score FROM scores
         WHERE season_id = ? AND player_id = ? AND is_formula = 0 AND score IS NOT NULL
         ORDER BY week`,
        [seasonDbId, playerId]
      )
      const scores = (scoresR.rows as DbRow[]).map((r) => r.score as number)
      if (scores.length === 0) continue
      const total = scores.reduce((sum, s) => sum + s, 0)
      await db.execute(
        `INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
         VALUES (?, ?, 'total', ?, datetime('now'))`,
        [seasonDbId, playerId, total]
      )
      const totalMinusDrops =
        scores.length > dropLowestCount
          ? total -
            [...scores]
              .sort((a, b) => a - b)
              .slice(0, dropLowestCount)
              .reduce((s, x) => s + x, 0)
          : total
      await db.execute(
        `INSERT OR REPLACE INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
         VALUES (?, ?, 'total_minus_two_lowest', ?, datetime('now'))`,
        [seasonDbId, playerId, totalMinusDrops]
      )
    }

    return NextResponse.json({ success: true, count: Object.keys(cells).length })
  } catch (e) {
    console.error('POST /api/cells/batch error:', e)
    return NextResponse.json({ error: 'Failed to save cells' }, { status: 500 })
  }
}
