'use client'

import { useEffect, useState } from 'react'
import { fetchCells, checkHealth } from '../lib/api'
import { EIGHT_PLAYER_COLUMNS } from '../lib/seasons'
import { getLeaderboardFromCells } from '../lib/playoffUtils'
import type { LeaderboardEntry } from '../lib/playoffUtils'
import styles from './Leaderboard.module.css'

export function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [useDatabase, setUseDatabase] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const loadLeaderboard = async () => {
            try {
                setIsLoading(true)

                const dbAvailable = await checkHealth()
                setUseDatabase(dbAvailable)

                if (dbAvailable) {
                    try {
                        const cells = await fetchCells('season7')
                        const entries = getLeaderboardFromCells(cells, [...EIGHT_PLAYER_COLUMNS], {
                            calculation: 'total_minus_two_lowest',
                        })
                        setLeaderboard(entries)
                    } catch (error) {
                        console.error('Error loading leaderboard:', error)
                        setLeaderboard([])
                    }
                } else {
                    setLeaderboard([])
                }
            } catch (error) {
                console.error('Error in loadLeaderboard:', error)
                setLeaderboard([])
            } finally {
                setIsLoading(false)
            }
        }

        loadLeaderboard()
    }, [])

    // Always show loading state during SSR to prevent hydration mismatch
    if (!mounted || isLoading) {
        return (
            <div className={styles.leaderboard}>
                <h3 className={styles.title}>Season 7 leaderboard (w/ drops)</h3>
                <p className={styles.loading}>Loading...</p>
            </div>
        )
    }

    if (!useDatabase) {
        return (
            <div className={styles.leaderboard}>
                <h3 className={styles.title}>Season 7 leaderboard (w/ drops)</h3>
                <p className={styles.unavailable}>Database unavailable</p>
            </div>
        )
    }

    const leaderScore = leaderboard[0]?.score ?? 0

    return (
        <div className={styles.leaderboard}>
            <h3 className={styles.title}>Season 7 leaderboard (w/ drops)</h3>
            <div
                className={styles.tableWrapper}
                role="region"
                aria-label="Season 7 leaderboard"
                tabIndex={0}
            >
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.rankHeader}>Rank</th>
                            <th className={styles.nameHeader}>Player</th>
                            <th className={styles.scoreHeader}>Score</th>
                            <th className={styles.gapHeader}>Behind leader</th>
                            <th className={styles.gapHeader}>Behind next</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, index) => {
                            const pointsBehindLeader = leaderScore - entry.score
                            const pointsBehindNext =
                                index === 0 ? 0 : leaderboard[index - 1].score - entry.score

                            return (
                                <tr key={entry.name} className={styles.row}>
                                    <td className={styles.rank}>
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `${index + 1}`}
                                    </td>
                                    <td className={styles.name}>{entry.name}</td>
                                    <td className={styles.score}>{entry.score}</td>
                                    <td className={styles.gap}>{pointsBehindLeader}</td>
                                    <td className={styles.gap}>{pointsBehindNext}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
