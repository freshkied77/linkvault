# LinkVault

URL Shortener with Ad Revenue - Short links that pay you.

## How It Works

1. Create short links through the dashboard
2. Share your links anywhere
3. When people click, they see a quick ad before redirecting
4. You earn money from the ad views

## Features

- Custom short URLs
- Click analytics
- Password protection (optional)
- Ad-ready redirect page

## Quick Deploy

```bash
# Backend
cd backend
npm install
node server.js

# Frontend  
cd frontend
npm install
npm run dev
```

## Environment Variables

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

## Ad Integration

Replace these in server.js:
- `YOUR_ADSENSE_CLIENT_ID` - Your Google AdSense client ID
- `YOUR_AD_SLOT_ID` - Your ad slot ID

Or use other ad networks like:
- PropellerAds
- AdMaven
- ClicksFly
