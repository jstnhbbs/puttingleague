'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import { Leaderboard } from './components/Leaderboard'
import { SeasonPlayoff } from './components/SeasonPlayoff'
import { fetchSeasons, type SeasonSummary } from './lib/api'

export default function Home() {
    const [seasons, setSeasons] = useState<SeasonSummary[]>([])
    const [currentSeason, setCurrentSeason] = useState<SeasonSummary | null>(null)

    useEffect(() => {
        let isMounted = true

        fetchSeasons().then((allSeasons) => {
            if (!isMounted) return
            setSeasons([...allSeasons].reverse())
            setCurrentSeason(allSeasons.find((season) => season.status === 'current') ?? null)
        })

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1 className={styles.title}>Putting League</h1>
                <p className={styles.subtitle}>Select a season to view</p>
                <div className={styles.dashboardGrid}>
                    <div className={styles.dashboardPanel}>
                        <Leaderboard season={currentSeason} className={styles.dashboardCard} />
                    </div>
                    <div className={styles.dashboardPanel}>
                        {currentSeason && (
                            <SeasonPlayoff
                                season={currentSeason}
                                isAuthenticated={false}
                                className={styles.dashboardCard}
                            />
                        )}
                    </div>
                </div>
                <div className={styles.grid}>
                    {seasons.map((sheet) => (
                        <Link
                            key={sheet.id}
                            href={`/sheet/${sheet.id}`}
                            className={styles.card}
                        >
                            <h2 className={styles.cardTitle}>{sheet.title}</h2>
                            <p className={styles.cardDescription}>{sheet.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
