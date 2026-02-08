# 🚀 Tailor Shop Startup Guide

## Quick Start Options

### Option 1: Double-click to Start Everything
📁 **File:** `start-all.bat`
- Double-click this file to start both backend and frontend
- Backend starts first, then frontend
- Both run in separate windows

### Option 2: PowerShell Script
📁 **File:** `start-all.ps1`
- Right-click → "Run with PowerShell"
- More reliable with better error handling
- Can stop all services with one key press

### Option 3: Command Line
```bash
# Start both services
npm run dev

# Or start all
npm run start:all

# Or start backend only
npm run start:backend
```

### Option 4: Individual Scripts
- `start-backend.bat` - Backend only
- `start-frontend.bat` - Frontend with auto-backend

## 🌐 Access Points

**Backend Server:**
- Local: http://localhost:3000
- Network: http://10.221.169.66:3000

**Frontend App:**
- Expo Go: Scan QR code
- Web: http://localhost:19006
- Mobile: Use Expo app

## 🔑 Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

## 📱 APK Download
Latest APK: https://expo.dev/accounts/creative_hub/projects/ladies-tailor-shop/builds/

## 🛠️ Troubleshooting

**Backend Not Starting:**
- Check if Node.js is installed
- Verify backend folder exists
- Run `cd backend && node index.js` manually

**Frontend Not Starting:**
- Check if Expo CLI is installed
- Run `npm install` if dependencies missing
- Clear cache: `expo start -c`

**Network Issues:**
- Ensure both devices on same WiFi
- Check firewall settings
- Verify IP address: `ipconfig`

**Port Conflicts:**
- Backend uses port 3000
- Frontend uses port 19006
- Close other apps using these ports
