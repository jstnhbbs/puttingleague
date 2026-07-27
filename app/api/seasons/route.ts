import { NextResponse } from 'next/server'
import {
  getDb,
  getFallbackSeasonPlayers,
  getFallbackSeasons,
  getSeasonsWithPlayers,
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
    return NextResponse.json({ seasons: await getSeasonsWithPlayers(db) })
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
