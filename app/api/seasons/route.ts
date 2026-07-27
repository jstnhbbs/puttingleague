import { NextResponse } from 'next/server'
import {
  getDb,
  getFallbackSeasonPlayers,
  getFallbackSeasons,
  getSeasonPlayers,
  getSeasonSummaries,
  isTursoConfigured,
} from '../../lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({
      seasons: getFallbackSeasons().map((season) => ({
        ...season,
        players: getFallbackSeasonPlayers(season.id),
      })),
    })
  }

  try {
    const db = getDb()
    const seasons = await getSeasonSummaries(db)
    const seasonsWithPlayers = await Promise.all(
      seasons.map(async (season) => ({
        ...season,
        players: await getSeasonPlayers(db, season.id),
      }))
    )

    return NextResponse.json({ seasons: seasonsWithPlayers })
  } catch (error) {
    console.error('GET /api/seasons error:', error)
    return NextResponse.json({
      seasons: getFallbackSeasons().map((season) => ({
        ...season,
        players: getFallbackSeasonPlayers(season.id),
      })),
    })
  }
}
