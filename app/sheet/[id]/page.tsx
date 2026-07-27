import TestPageContent from './TestPageContent'

export default function SheetPage({ params }: { params: { id: string } }) {
  return <TestPageContent seasonId={params.id} />
}
