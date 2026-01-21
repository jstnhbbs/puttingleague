# Putting League API Server

Simple SQLite-based API server for persistent data storage.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Database

The SQLite database is stored in `server/data/puttingleague.db`. This file is created automatically on first run.

## API Endpoints

- `GET /api/cells` - Get all cells
- `POST /api/cells` - Save a single cell
- `POST /api/cells/batch` - Save multiple cells at once
- `DELETE /api/cells/:cellKey` - Delete a cell
- `GET /api/health` - Health check

## Making it accessible from GitHub Pages

1. **Update CORS settings** in `server.js` - Replace `yourusername.github.io` with your actual GitHub Pages URL

2. **Expose your Mac mini to the internet** (choose one):
   - Use a service like ngrok: `ngrok http 3001`
   - Set up port forwarding on your router
   - Use a dynamic DNS service
   - Deploy to a cloud service (Heroku, Railway, Render, etc.)

3. **Update the API URL** in your Next.js app to point to your server

## Running as a service (macOS)

To run the server automatically on startup:

1. Create a plist file at `~/Library/LaunchAgents/com.puttingleague.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.puttingleague.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/puttingleague/server/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/path/to/puttingleague/server</string>
</dict>
</plist>
```

2. Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.puttingleague.server.plist
```
