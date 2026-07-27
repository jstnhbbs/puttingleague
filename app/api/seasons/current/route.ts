import { NextResponse } from 'next/server'
import {
  getCurrentSeason,
  getFallbackSeasonPlayers,
  getFallbackSeasons,
  getDb,
  getSeasonPlayers,
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
    const season = await getCurrentSeason(db)
    return NextResponse.json(
      season ? { season: { ...season, players: await getSeasonPlayers(db, season.id) } } : { season: null }
    )
  } catch (error) {
    console.error('GET /api/seasons/current error:', error)
    const season = getFallbackSeasons().find((item) => item.status === 'current') ?? null
    return NextResponse.json(
      season ? { season: { ...season, players: getFallbackSeasonPlayers(season.id) } } : { season: null }
    )
  }
}
