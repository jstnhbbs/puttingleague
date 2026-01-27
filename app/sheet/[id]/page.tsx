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

  // Show editable table for all seasons (you can customize which seasons use the table)
  // For now, all seasons will use the editable table
  return <TestPageContent sheetTitle={sheet.title} seasonId={params.id} />
}
