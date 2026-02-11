# Putting League

A Next.js application with Google Sheets integration.

## Features

- Home page with card-based navigation
- Dynamic pages for embedding Google Sheets
- Modern, responsive UI

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

## Configuration

### Adding Google Sheets

1. Open `app/page.tsx` and update the `sheets` array with your sheet information
2. For each sheet, you need:
   - `id`: A unique identifier (used in the URL)
   - `title`: Display name for the card
   - `description`: Card description
   - `sheetUrl`: Your Google Sheet sharing URL

3. Also update the `sheets` object in `app/sheet/[id]/page.tsx` with the same data

### Google Sheets Setup

1. Open your Google Sheet
2. Click "Share" → "Get link"
3. Set permissions to "Anyone with the link can view" (for public access)
4. Copy the sharing URL and paste it into the `sheetUrl` field

**Note**: The app automatically converts sharing URLs to embed URLs. Make sure your Google Sheet is set to be viewable by anyone with the link.

## Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page with cards
│   ├── page.module.css     # Home page styles
│   ├── globals.css         # Global styles
│   └── sheet/
│       └── [id]/
│           ├── page.tsx    # Dynamic sheet page
│           └── page.module.css
├── next.config.js          # Next.js configuration
└── package.json
```

## License

MIT
