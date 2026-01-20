import Link from 'next/link'
import styles from './page.module.css'
import { sheets } from './data/sheets'

export default function Home() {
    // Reverse the sheets array to display in reverse order
    const reversedSheets = [...sheets].reverse()

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1 className={styles.title}>Putting League</h1>
                <p className={styles.subtitle}>Select a sheet to view</p>
                <div className={styles.grid}>
                    {reversedSheets.map((sheet) => (
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
