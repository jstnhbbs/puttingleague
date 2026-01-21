# Setting up ngrok for HTTPS Access

## Step 1: Install ngrok

### Option A: Using Homebrew (Recommended)
```bash
brew install ngrok/ngrok/ngrok
```

### Option B: Manual Installation
1. Go to https://ngrok.com/download
2. Download the macOS version
3. Unzip and move to `/usr/local/bin`:
```bash
unzip ngrok.zip
sudo mv ngrok /usr/local/bin/
```

## Step 2: Create a free ngrok account

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

## Step 3: Authenticate ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Replace `YOUR_AUTH_TOKEN_HERE` with the token from the dashboard.

## Step 4: Start your API server

```bash
cd server
npm start
```

Make sure it's running on port 3001.

## Step 5: Start ngrok tunnel

In a new terminal window:

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3001
```

Copy the HTTPS URL (the one starting with `https://`).

## Step 6: Update your API configuration

Update `app/lib/api.ts`:

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://YOUR_NGROK_URL.ngrok-free.app'
```

Replace `YOUR_NGROK_URL` with the URL from ngrok (e.g., `abc123.ngrok-free.app`).

## Step 7: Update CORS in server.js

Add your ngrok URL to the CORS origins:

```javascript
origin: [
  'http://localhost:3000',
  'https://jstnhbbs.github.io',
  'https://YOUR_NGROK_URL.ngrok-free.app', // Add this
  /\.github\.io$/,
  /\.ngrok-free\.app$/ // Allow any ngrok URL
],
```

## Important Notes:

1. **Free tier limitations:**
   - The URL changes every time you restart ngrok (unless you pay for a static domain)
   - You'll need to update the API URL each time
   - There's a connection limit

2. **For production, consider:**
   - ngrok paid plan for static domains
   - Cloudflare Tunnel (free, static domains)
   - Setting up proper SSL on your Mac mini

3. **Keep ngrok running:**
   - Keep the ngrok terminal window open
   - If it closes, restart it and update the URL

## Testing:

1. Start your server: `cd server && npm start`
2. Start ngrok: `ngrok http 3001`
3. Update the API URL in `app/lib/api.ts`
4. Test: Visit `https://YOUR_NGROK_URL.ngrok-free.app/api/health` in your browser
