export interface Sheet {
  id: string
  title: string
  description: string
  sheetUrl: string
}

export const sheets: Sheet[] = [
  {
    id: 'sheet1',
    title: 'Sheet 1',
    description: 'View and edit Sheet 1',
    // Replace with your actual Google Sheet embed URL
    // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?usp=sharing
    sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_1/edit?usp=sharing',
  },
  {
    id: 'sheet2',
    title: 'Sheet 2',
    description: 'View and edit Sheet 2',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_2/edit?usp=sharing',
  },
  {
    id: 'sheet3',
    title: 'Sheet 3',
    description: 'View and edit Sheet 3',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_3/edit?usp=sharing',
  },
  {
    id: 'sheet4',
    title: 'Sheet 4',
    description: 'View and edit Sheet 4',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_4/edit?usp=sharing',
  },
  {
    id: 'sheet5',
    title: 'Sheet 5',
    description: 'View and edit Sheet 5',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_5/edit?usp=sharing',
  },
]

// Convert Google Sheets sharing URL to embed URL
export function getEmbedUrl(sheetUrl: string): string {
  // Extract the sheet ID from the URL
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    const sheetId = match[1]
    // Return the embed URL
    return `https://docs.google.com/spreadsheets/d/${sheetId}/preview`
  }
  return sheetUrl
}
