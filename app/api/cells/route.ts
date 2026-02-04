import { NextRequest, NextResponse } from 'next/server'
import {
  getDb,
  isTursoConfigured,
  getPlayerListForSeason,
  cellKeyToRelational,
  relationalToCellKey,
  type DbRow,
} from '../../lib/db'

function ensureSeasonPlayerRelationships(
  db: ReturnType<typeof getDb>,
  seasonId: string
): Promise<void> {
  const playerList = [...getPlayerListForSeason(seasonId)]

  return db.execute('SELECT id FROM seasons WHERE season_id = ?', [seasonId]).then((r) => {
    const seasonRow = (r.rows as DbRow[])[0]
    if (!seasonRow) return
    const seasonDbId = seasonRow.id as number
    return Promise.all(
      playerList.map(async (playerName, colIndex) => {
        const pr = await db.execute('SELECT id FROM players WHERE name = ?', [playerName])
        const playerRow = (pr.rows as DbRow[])[0]
        if (!playerRow) return
        const playerId = playerRow.id as number
        const ex = await db.execute(
          'SELECT id FROM season_players WHERE season_id = ? AND player_id = ?',
          [seasonDbId, playerId]
        )
        if ((ex.rows as DbRow[]).length === 0) {
          await db.execute(
            'INSERT OR IGNORE INTO season_players (season_id, player_id, display_order) VALUES (?, ?, ?)',
            [seasonDbId, playerId, colIndex]
          )
        }
      })
    ).then(() => {})
  })
}

export async function GET(request: NextRequest) {
  if (!isTursoConfigured()) {
    return NextResponse.json({}, { status: 200 })
  }
  try {
    const seasonId = (request.nextUrl.searchParams.get('season') as string) || 'season6'
    const db = getDb()

    const seasonResult = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [
      seasonId,
    ])
    const seasonRow = (seasonResult.rows as DbRow[])[0]
    if (!seasonRow) return NextResponse.json({})

    const seasonDbId = seasonRow.id as number
    const playerList: string[] = [...getPlayerListForSeason(seasonId)]
    const cells: Record<string, { value: string; isFormula: boolean }> = {}

    const scoresResult = await db.execute(
      `SELECT p.name, s.week, s.score, s.is_formula, s.formula_text
       FROM scores s
       JOIN players p ON s.player_id = p.id
       JOIN season_players sp ON sp.season_id = s.season_id AND sp.player_id = p.id
       WHERE s.season_id = ?
       ORDER BY sp.display_order, s.week`,
      [seasonDbId]
    )
    for (const row of scoresResult.rows as DbRow[]) {
      const name = String(row.name ?? '')
      const colIndex = playerList.indexOf(name)
      if (colIndex === -1) continue
      const week = row.week as number
      const rowIndex = week - 1
      const cellKey = relationalToCellKey(rowIndex, colIndex)
      const score = row.score
      const isFormula = (row.is_formula as number) === 1
      const formulaText = row.formula_text as string | null
      cells[cellKey] = {
        value: score != null ? String(score) : isFormula && formulaText ? formulaText : '',
        isFormula,
      }
    }

    const calcResult = await db.execute(
      `SELECT p.name, cs.calculation_type, cs.value
       FROM calculated_scores cs
       JOIN players p ON cs.player_id = p.id
       JOIN season_players sp ON sp.season_id = cs.season_id AND sp.player_id = p.id
       WHERE cs.season_id = ?
       ORDER BY sp.display_order`,
      [seasonDbId]
    )
    for (const row of calcResult.rows as DbRow[]) {
      const name = String(row.name ?? '')
      const colIndex = playerList.indexOf(name)
      if (colIndex === -1) continue
      const type = row.calculation_type as string
      const rowIndex = type === 'total' ? 10 : 11
      const cellKey = relationalToCellKey(rowIndex, colIndex)
      cells[cellKey] = {
        value: String(row.value ?? 0),
        isFormula: false,
      }
    }

    return NextResponse.json(cells)
  } catch (e) {
    console.error('GET /api/cells error:', e)
    return NextResponse.json({ error: 'Failed to fetch cells' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const { cellKey, value, isFormula, seasonId = 'season6' } = body as {
      cellKey?: string
      value?: string
      isFormula?: boolean
      seasonId?: string
    }
    if (!cellKey) {
      return NextResponse.json({ error: 'cellKey is required' }, { status: 400 })
    }

    const rel = cellKeyToRelational(cellKey, seasonId)
    if (!rel) {
      return NextResponse.json({ error: 'Invalid cellKey format' }, { status: 400 })
    }

    const db = getDb()
    await ensureSeasonPlayerRelationships(db, seasonId)

    const seasonR = await db.execute('SELECT id FROM seasons WHERE season_id = ?', [seasonId])
    const seasonRow = (seasonR.rows as DbRow[])[0]
    const playerR = await db.execute('SELECT id FROM players WHERE name = ?', [rel.playerName])
    const playerRow = (playerR.rows as DbRow[])[0]
    if (!seasonRow || !playerRow) {
      return NextResponse.json({ error: 'Invalid season or player' }, { status: 400 })
    }
    const seasonDbId = seasonRow.id as number
    const playerId = playerRow.id as number

    if (rel.week != null) {
      const scoreVal = value ? parseFloat(value) : null
      await db.execute(
        `INSERT INTO scores (season_id, player_id, week, score, is_formula, formula_text, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(season_id, player_id, week) DO UPDATE SET
           score = excluded.score,
           is_formula = excluded.is_formula,
           formula_text = excluded.formula_text,
           updated_at = datetime('now')`,
        [seasonDbId, playerId, rel.week, scoreVal, isFormula ? 1 : 0, isFormula && value != null ? value : null]
      )
    } else if (rel.isTotal) {
      const v = parseFloat(value ?? '0') || 0
      await db.execute(
        `INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
         VALUES (?, ?, 'total', ?, datetime('now'))
         ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET value = excluded.value, calculated_at = datetime('now')`,
        [seasonDbId, playerId, v]
      )
    } else if (rel.isTotalMinusTwoLowest) {
      const v = parseFloat(value ?? '0') || 0
      await db.execute(
        `INSERT INTO calculated_scores (season_id, player_id, calculation_type, value, calculated_at)
         VALUES (?, ?, 'total_minus_two_lowest', ?, datetime('now'))
         ON CONFLICT(season_id, player_id, calculation_type) DO UPDATE SET value = excluded.value, calculated_at = datetime('now')`,
        [seasonDbId, playerId, v]
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('POST /api/cells error:', e)
    return NextResponse.json({ error: 'Failed to save cell' }, { status: 500 })
  }
}
