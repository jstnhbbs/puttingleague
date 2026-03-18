'use client'

import { useEffect, useState } from 'react'
import { fetchCells, checkHealth } from '../lib/api'
import { getLeaderboardFromCells } from '../lib/playoffUtils'
import type { LeaderboardEntry } from '../lib/playoffUtils'
import styles from './Leaderboard.module.css'

const SEASON6_COLUMNS = ['Hunter', 'Trevor', 'Konner', 'Silas', 'Jason', 'Graham', 'Tyler', 'Brad']

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
                        const cells = await fetchCells('season6')
                        const entries = getLeaderboardFromCells(cells, SEASON6_COLUMNS, {
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
                <h3 className={styles.title}>Leaderboard</h3>
                <p className={styles.loading}>Loading...</p>
            </div>
        )
    }

    if (!useDatabase) {
        return (
            <div className={styles.leaderboard}>
                <h3 className={styles.title}>Leaderboard</h3>
                <p className={styles.unavailable}>Database unavailable</p>
            </div>
        )
    }

    return (
        <div className={styles.leaderboard}>
            <h3 className={styles.title}>Leaderboard (w/ Drops)</h3>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.rankHeader}>Rank</th>
                        <th className={styles.nameHeader}>Player</th>
                        <th className={styles.scoreHeader}>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={entry.name} className={styles.row}>
                            <td className={styles.rank}>
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `${index + 1}`}
                            </td>
                            <td className={styles.name}>{entry.name}</td>
                            <td className={styles.score}>{entry.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
