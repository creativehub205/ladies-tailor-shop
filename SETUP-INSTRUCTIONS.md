# 🚀 Quick Setup Instructions for Tailor Shop App

## 🔧 **Step 1: Find Your Local IP Address**

### Windows:
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" (usually starts with 192.168.x.x)
4. Copy this IP address

### Mac/Linux:
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for "inet" address (usually starts with 192.168.x.x)
4. Copy this IP address

## 📝 **Step 2: Update Your IP Address**

1. Open file: `src/utils/config.js`
2. Replace the IP in the `getLocalIP()` function with your actual IP:

```javascript
export const getLocalIP = () => {
  // Replace with YOUR actual IP address
  return '192.168.1.100'; // <-- CHANGE THIS
};
```

## 🖥️ **Step 3: Start Backend Server**

### Option A: Using Batch File (Easy)
1. Double-click `start-backend.bat`
2. Wait for "Server running on http://localhost:3000"

### Option B: Manual
1. Open Command Prompt
2. Navigate to project folder
3. Type: `cd backend`
4. Type: `node index.js`

## 📱 **Step 4: Start Frontend**

### Option A: Using Batch File (Easy)
1. Double-click `start-frontend.bat`
2. Wait for Expo to start
3. Scan QR code with Expo Go app

### Option B: Manual
1. Open Command Prompt
2. Navigate to project folder
3. Type: `npm start`
4. Scan QR code with Expo Go app

## 📲 **Step 5: Open on Mobile**

1. Install **Expo Go** app from App Store/Play Store
2. Open Expo Go app
3. Scan QR code from terminal
4. App will load on your phone

## 🔑 **Login Credentials**
- **Username:** `admin`
- **Password:** `admin123`

## 🐛 **Troubleshooting**

### ❌ "Cannot connect to server"
- Make sure backend server is running (check terminal)
- Verify your IP address is correct in `config.js`
- Check that phone and computer are on same WiFi network

### ❌ "Network error"
- Restart backend server
- Check firewall settings
- Try different IP address from ipconfig

### ❌ "Expo Go not loading"
- Make sure both devices are on same WiFi
- Restart Expo Go app
- Clear cache in Expo Go

### ❌ "Database error"
- Delete `tailor_shop.db` file from backend folder
- Restart backend server (will create fresh database)

## 📞 **Need Help?**
If you still face issues:
1. Check that backend shows "Server running on http://localhost:3000"
2. Verify IP address is correct
3. Ensure both devices are on same WiFi network
4. Try restarting both backend and frontend

## ✅ **Working Setup Should Show:**
- Backend: "Server running on http://localhost:3000"
- Frontend: Expo QR code in terminal
- Mobile: App loads and shows login screen
