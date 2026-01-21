import Link from 'next/link'
import styles from './page.module.css'
import { sheets, getEmbedUrl } from '../../data/sheets'
import { SheetIframe } from '../../components/SheetIframe'
import TestPageContent from './TestPageContent'

export function generateStaticParams() {
  return sheets.map((sheet) => ({
    id: sheet.id,
  }))
}

export default function SheetPage({ params }: { params: { id: string } }) {
  const sheet = sheets.find((s) => s.id === params.id)

  if (!sheet) {
    return (
      <div className={styles.container}>
        <h1>Sheet not found</h1>
        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    )
  }

  // For Season 6, show the test page content instead of the Google Sheet
  if (params.id === 'season6') {
    return <TestPageContent sheetTitle={sheet.title} />
  }

  const embedUrl = getEmbedUrl(sheet.sheetUrl)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Back to Home
        </Link>
        <h1 className={styles.title}>{sheet.title}</h1>
      </div>
      <div className={styles.sheetContainer}>
        <SheetIframe
          src={embedUrl}
          className={styles.sheetFrame}
          title={sheet.title}
        />
      </div>
    </div>
  )
}
