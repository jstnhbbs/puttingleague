# Connecting to Remote SQLite Database

Since SQLite is a file-based database, you need to access the file over the network. Here are several methods:

## Method 1: SSH Tunneling (Recommended)

### Using DBeaver:
1. Create new SQLite connection
2. Go to **SSH** tab
3. Enable **"Use SSH Tunnel"**
4. Configure SSH:
   - **Host**: Your Mac mini's IP (e.g., `192.168.1.100` or `macmini.local`)
   - **Port**: `22`
   - **User**: Your Mac mini username
   - **Auth**: Password or SSH key
5. Configure SQLite:
   - **Path**: `/Users/YOUR_USERNAME/Documents/Development/puttingleague/server/data/puttingleague.db`
   - Replace `YOUR_USERNAME` with your actual Mac mini username

### Using Command Line:
```bash
# On your local machine, create SSH tunnel
ssh -L 3002:localhost:3001 -N username@macmini-ip

# Then connect to localhost:3002 (but SQLite doesn't work this way)
# Better: Mount via SSHFS (see Method 2)
```

## Method 2: SSHFS (Mount Remote Filesystem)

### Install SSHFS:
```bash
# macOS
brew install sshfs

# Linux
sudo apt-get install sshfs
```

### Mount Remote Directory:
```bash
# Create local mount point (must exist before mounting)
mkdir -p ~/macmini-db

# Mount remote directory
sshfs username@macmini-ip:/Users/username/Documents/Development/puttingleague/server/data ~/macmini-db

# Now connect DBeaver to:
# ~/macmini-db/puttingleague.db
```

**⚠️ macOS Permission Issues:**
If you get "Operation not permitted" or "cannot stat the mount point" errors:

1. **Grant Full Disk Access** (macOS Ventura/Sonoma):
   - System Settings → Privacy & Security → Full Disk Access
   - Add your Terminal app (or iTerm, etc.)
   - Restart Terminal and try again

2. **Check FUSE Installation**:
   ```bash
   # Verify macFUSE is installed
   brew list macfuse || brew install macfuse
   
   # Verify sshfs is installed
   brew list sshfs || brew install sshfs
   ```

3. **Try with sudo** (if needed):
   ```bash
   sudo mkdir -p ~/macmini-db
   sudo sshfs -o allow_other,default_permissions username@macmini-ip:/path/to/data ~/macmini-db
   ```

### Unmount when done:
```bash
# Try regular umount first
umount ~/macmini-db

# If that fails, try force unmount (macOS)
diskutil unmount force ~/macmini-db

# Or kill the FUSE process
killall sshfs
```

### Troubleshooting: Database File Not Showing

If SSHFS mounts successfully but you don't see the database file:

#### 1. Verify the Mount Path is Correct
```bash
# Check what's actually mounted
mount | grep macmini-db

# You should see something like:
# justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server/data
```

**Common issue**: The mount might point to the wrong directory. Check if your path includes "Development" or not:
- ✅ Correct: `/Users/justinhobbs/Documents/Development/puttingleague/server/data`
- ❌ Wrong: `/Users/justinhobbs/Documents/puttingleague/server/data` (missing "Development")

#### 2. Check if Database File Exists on Remote Server
```bash
# SSH into the remote server and verify the file exists
ssh justinhobbs@192.168.4.142
cd /Users/justinhobbs/Documents/Development/puttingleague/server/data
ls -la puttingleague.db
```

#### 3. Fix Incorrect Mount Path
If the mount path is wrong, unmount and remount with the correct path:
```bash
# Unmount the incorrect mount
umount ~/macmini-db
# Or if that fails:
killall sshfs

# Remount with the correct path (verify the path first!)
sshfs justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server/data ~/macmini-db

# Verify the mount
mount | grep macmini-db

# List files (should now show puttingleague.db)
ls -la ~/macmini-db/
```

#### 4. Check File Permissions
```bash
# Try accessing the file directly
file ~/macmini-db/puttingleague.db

# Check if you can read it
sqlite3 ~/macmini-db/puttingleague.db ".tables"
```

#### 5. Alternative: Mount Parent Directory
If the `data` directory has permission issues, try mounting the parent directory:
```bash
# Mount the entire server directory
sshfs justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server ~/macmini-server

# Then access the database at:
# ~/macmini-server/data/puttingleague.db
```

### Troubleshooting SSHFS Connection Issues

If you get "remote host has disconnected" or "Operation not permitted" errors:

#### 1. Test Basic SSH Connection First
```bash
# Try connecting with just the IP address (not hostname)
ssh justinhobbs@192.168.4.142

# If hostname doesn't resolve, use IP directly
sshfs justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server/data ~/macmini-db
```

#### 2. Check Network Connectivity
```bash
# Ping the remote host
ping -c 3 192.168.4.142

# Check if SSH port is open
nc -zv 192.168.4.142 22
```

#### 3. Verify Remote Path Exists
```bash
# SSH in and check the path
ssh justinhobbs@192.168.4.142 "ls -la /Users/justinhobbs/Documents/Development/puttingleague/server/data"
```

#### 4. macOS Firewall/Security Settings
- **System Settings → Network → Firewall**: Ensure SSH is allowed
- **System Settings → Privacy & Security**: Check if network access is restricted
- Try disabling firewall temporarily to test

#### 5. Use Verbose Mode for Debugging
```bash
# SSHFS with verbose output
sshfs -o debug,sshfs_debug,loglevel=debug justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server/data ~/macmini-db
```

#### 6. Alternative: Use IP Address Instead of Hostname
If `link-192.168.4.142` doesn't resolve, use the IP directly:
```bash
sshfs justinhobbs@192.168.4.142:/Users/justinhobbs/Documents/Development/puttingleague/server/data ~/macmini-db
```

#### 7. Check SSH Configuration
```bash
# Test SSH config
ssh -v justinhobbs@192.168.4.142

# If you have SSH keys, ensure they're added
ssh-add ~/.ssh/id_rsa
```

#### 8. Verify Remote SSH Service
On the remote Mac mini:
```bash
# Check if SSH is enabled
sudo systemsetup -getremotelogin

# Enable SSH if needed
sudo systemsetup -setremotelogin on
```

#### Common Solutions:
- **"Operation not permitted"**: Usually macOS firewall or network permissions. Try disabling firewall temporarily or check System Settings → Privacy & Security
- **"Connection refused"**: SSH service not running on remote host. Enable Remote Login in System Settings → Sharing
- **"Hostname not found"**: Use IP address instead of hostname
- **"Permission denied"**: Check SSH key authentication or use password auth
- **"Too many authentication failures"**: SSH server is blocking connections. Solutions:
  - Wait 5-10 minutes for the lockout to clear
  - Use SSH key authentication instead of password:
    ```bash
    # Generate SSH key if you don't have one
    ssh-keygen -t ed25519 -C "your_email@example.com"
    
    # Copy key to remote server
    ssh-copy-id justinhobbs@192.168.4.142
    
    # Then try SSHFS again
    ```
  - Or specify which key to use:
    ```bash
    sshfs -o IdentityFile=~/.ssh/id_rsa justinhobbs@192.168.4.142:/path/to/data ~/macmini-db
    ```
- **"fts_read: Permission denied"** or **"remote host has disconnected"**: 
  - Usually caused by SSH authentication failures (see above)
  - Or macOS Full Disk Access not granted to Terminal
  - Try mounting to `/tmp` instead of home directory:
    ```bash
    mkdir -p /tmp/macmini-db
    sshfs justinhobbs@192.168.4.142:/path/to/data /tmp/macmini-db
    ```

## Method 3: Network Share (SMB/AFP)

### On Mac mini:
1. System Settings → Sharing
2. Enable **File Sharing**
3. Share the folder: `/Users/username/Documents/Development/puttingleague/server/data`
4. Note the share name

### On your local machine:
1. Connect to Server: `smb://macmini-ip` or `afp://macmini-ip`
2. Mount the shared folder
3. Connect DBeaver to the mounted database file

## Method 4: Copy Database File Locally

### Quick one-time access:
```bash
# Copy database from Mac mini
scp username@macmini-ip:/Users/username/Documents/Development/puttingleague/server/data/puttingleague.db ~/Downloads/

# Open in DBeaver, then copy back when done
scp ~/Downloads/puttingleague.db username@macmini-ip:/Users/username/Documents/Development/puttingleague/server/data/puttingleague.db.backup
```

**⚠️ Warning**: This creates a copy - changes won't sync automatically!

## Method 5: Use the API Instead

Since you have a REST API running, you could also:
- Use the API endpoints to query data
- Build a simple admin interface
- Use tools like Postman/Insomnia to query the API

API endpoints:
- `GET /api/debug/season/:seasonId` - Get season info
- `GET /api/cells?season=season6` - Get all cells
- etc.

## Finding Your Mac mini's IP Address

### On Mac mini:
```bash
# Terminal command
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

### Or use hostname:
```bash
# Mac mini hostname (usually works)
ping macmini.local
```

## Recommended Setup

**For regular use**: SSHFS (Method 2) - mounts the remote directory as if it's local

**For one-time access**: Copy file (Method 4) - simplest but manual

**For DBeaver**: SSH Tunnel (Method 1) - integrated, no mounting needed
