import Link from 'next/link'
import styles from './page.module.css'
import { sheets, mainSheetUrl } from './data/sheets'
import { SheetIframe } from './components/SheetIframe'

export default function Home() {
    // Reverse the sheets array to display in reverse order
    const reversedSheets = [...sheets].reverse()

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1 className={styles.title}>Putting League</h1>
                <p className={styles.subtitle}>Select a season to view</p>
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
                <div className={styles.sheetEmbed}>
                    <SheetIframe
                        src={mainSheetUrl}
                        className={styles.sheetFrame}
                        title="Putting League Main Sheet"
                    />
                </div>
            </div>
        </main>
    )
}
