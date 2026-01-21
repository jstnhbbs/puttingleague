export interface Sheet {
  id: string
  title: string
  description: string
  sheetUrl: string
}

// Main sheet URL for home page embed
export const mainSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=348497959&single=true'

export const sheets: Sheet[] = [
  {
    id: 'season1',
    title: 'Season 1',
    description: 'CHAMP: Hunter Thomas',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1134880669&single=true',
  },
  {
    id: 'season2',
    title: 'Season 2',
    description: 'CHAMP: Hunter Thomas',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1204258671&single=true',
  },
  {
    id: 'season3',
    title: 'Season 3',
    description: 'CHAMP: Hunter Thomas',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=0&single=true',
  },
  {
    id: 'season4',
    title: 'Season 4',
    description: 'CHAMP: Trevor Staub',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=1919204812&single=true',
  },
  {
    id: 'season5',
    title: 'Season 5',
    description: 'CHAMP: Trevor Staub',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=643864506&single=true',
  },
  {
    id: 'season6',
    title: 'Season 6',
    description: 'View Season 6',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbJtP2iVNdFvBKQiZeMJIuiEsLY5M8mv3hcGFXXxJSinxSWWJaBdCtaNZWILdAiT3iOafQoDlpD95N/pubhtml?gid=154588723&single=true',
  },
]

// Convert Google Sheets sharing URL to embed URL
export function getEmbedUrl(sheetUrl: string): string {
  // Check if URL is already a published HTML URL (pubhtml) - these can be embedded directly
  if (sheetUrl.includes('/pubhtml')) {
    return sheetUrl
  }

  // Extract the sheet ID from standard sharing URLs
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    const sheetId = match[1]
    // Return the embed URL using the extracted sheet ID
    return `https://docs.google.com/spreadsheets/d/${sheetId}/preview`
  }

  // Fallback: return original URL
  return sheetUrl
}
