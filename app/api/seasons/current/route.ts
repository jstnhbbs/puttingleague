import { NextResponse } from 'next/server'
import {
  getFallbackSeasonPlayers,
  getFallbackSeasons,
  getDb,
  getSeasonsWithPlayers,
  isTursoConfigured,
} from '../../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isTursoConfigured()) {
    const season = getFallbackSeasons().find((item) => item.status === 'current') ?? null
    return NextResponse.json(
      season ? { season: { ...season, players: getFallbackSeasonPlayers(season.id) } } : { season: null }
    )
  }

  try {
    const db = getDb()
    const season = (await getSeasonsWithPlayers(db)).find((item) => item.status === 'current') ?? null
    return NextResponse.json({ season })
  } catch (error) {
    console.error('GET /api/seasons/current error:', error)
    const season = getFallbackSeasons().find((item) => item.status === 'current') ?? null
    return NextResponse.json(
      season ? { season: { ...season, players: getFallbackSeasonPlayers(season.id) } } : { season: null }
    )
  }
}
