# Fixing ngrok JSON Parse Error

## The Problem

ngrok free tier shows an interstitial "Visit Site" page that returns HTML instead of JSON, causing the error:
```
JSON.parse: unexpected character at line 1 column 1
```

## Solutions

### Option 1: Bypass ngrok interstitial (Quick Fix)

1. Open your ngrok URL in a browser: `https://valanced-unintervening-ronald.ngrok-free.dev/api/health`
2. Click "Visit Site" button on the ngrok page
3. This sets a cookie that bypasses the interstitial for a while
4. Your API calls should now work

**Note:** This needs to be done periodically as the cookie expires.

### Option 2: Use ngrok with bypass header (Better)

Update your API calls to include a bypass header. However, ngrok free tier doesn't support this easily.

### Option 3: Upgrade ngrok (Best for Production)

- ngrok paid plans remove the interstitial page
- Static domains (no URL changes)
- Better for production use

### Option 4: Use Cloudflare Tunnel (Free Alternative)

Cloudflare Tunnel is free and doesn't have interstitial pages:

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:3001
```

This gives you a URL like `https://random-words.trycloudflare.com` without interstitial pages.

### Option 5: Use your Mac mini's IP directly (Local Network Only)

If all users are on the same network, use the IP address directly:
- Update `app/lib/api.ts` to use `http://100.72.185.61:3001`
- Make sure your Mac mini firewall allows port 3001

## Current Status

The code now:
- ✅ Detects when HTML is returned instead of JSON
- ✅ Logs the actual response to help debug
- ✅ Shows a warning if ngrok interstitial is detected
- ✅ Falls back gracefully to localStorage

Check your browser console for detailed error messages!
