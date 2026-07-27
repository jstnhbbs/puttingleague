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

### Admin Editing

Editing is protected by a signed, HTTP-only admin session cookie. Set these environment variables in `.env.local` and in your deployment environment:

```bash
ADMIN_PASSWORD="your editing password"
ADMIN_SESSION_SECRET="a long random string used to sign admin sessions"
```

`NEXTAUTH_SECRET` can be used as the signing secret if `ADMIN_SESSION_SECRET` is not set. Admin sessions expire after 12 hours.

### Seasons

Seasons, players, display order, playoff format, and scoring settings are backed by the database through the `/api/seasons` routes. Update the season catalog seed in `app/lib/db.ts` when bootstrapping a new season, then deploy to Vercel so Turso is synchronized by the API.

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
