/** Seasons 6–7: same 8-player roster and playoff bracket shape. */
export const EIGHT_PLAYER_SEASONS = ['season6', 'season7'] as const

export const EIGHT_PLAYER_COLUMNS = [
  'Hunter',
  'Trevor',
  'Konner',
  'Silas',
  'Jason',
  'Graham',
  'Tyler',
  'Brad',
] as const

export function isEightPlayerSeason(seasonId: string): boolean {
  return (EIGHT_PLAYER_SEASONS as readonly string[]).includes(seasonId)
}
