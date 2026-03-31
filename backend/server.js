const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const winston = require('winston');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/links');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)),
  transports: [new winston.transports.Console()]
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkvault')
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirect route - serves ad page then redirects
app.get('/:shortCode', async (req, res) => {
  try {
    const Link = require('./models/Link');
    const link = await Link.findOne({ shortCode: req.params.shortCode });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Increment click
    link.clicks += 1;
    link.clickDates.push(new Date());
    await link.save();
    
    // Ad configuration with fallback support for multiple networks
    const AD_NETWORK_PRIMARY = process.env.AD_NETWORK_PRIMARY || 'admaven'; // Primary ad network
    const AD_NETWORK_SECONDARY = process.env.AD_NETWORK_SECONDARY || 'propeller'; // Secondary network
    const AD_NETWORK_TERTIARY = process.env.AD_NETWORK_TERTIARY || 'clicksfly'; // Tertiary network
    const AD_ZONE_ID_PRIMARY = process.env.AD_ZONE_ID_PRIMARY || '474817'; // AdMaven Zone ID
    const AD_ZONE_ID_SECONDARY = process.env.AD_ZONE_ID_SECONDARY || ''; // PropellerAds Zone ID (to be added)
    const AD_ZONE_ID_TERTIARY = process.env.AD_ZONE_ID_TERTIARY || ''; // ClicksFly Zone ID (to be added)
    
    let adContent = '';
    
    // Try primary network first (AdMaven)
    if (AD_NETWORK_PRIMARY === 'admaven' && AD_ZONE_ID_PRIMARY) {
      adContent = `<iframe src="https://www.admaden.com/tag/?z=${AD_ZONE_ID_PRIMARY}" frameborder="0" scrolling="no" style="width:100%; height:280px; border:none;"></iframe>`;
    } 
    // Try secondary network (PropellerAds)
    else if (AD_NETWORK_SECONDARY === 'propeller' && AD_ZONE_ID_SECONDARY) {
      adContent = `<iframe src="https://publishers.propellerads.com/#${AD_ZONE_ID_SECONDARY}" frameborder="0"></iframe>`;
    }
    // Try tertiary network (ClicksFly)
    else if (AD_NETWORK_TERTIARY === 'clicksfly' && AD_ZONE_ID_TERTIARY) {
      adContent = `<div style="text-align: center; padding: 40px; color: #666;">ClicksFly ad loading...</div>`;
    }
    else if (AD_NETWORK_TERTIARY === 'adsense' && AD_ZONE_ID_TERTIARY) {
      // AdSense integration - expect format: "ca-pub-xxxxxxxxxxxx_1234567890"
      const [clientId, slotId] = AD_ZONE_ID_TERTIARY.split('_');
      adContent = `<ins class="adsbygoogle" style="display:block" data-ad-client="${clientId}" data-ad-slot="${slotId || '1234567890'}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    }
    else {
      // Default: Show sponsored content that promotes earning
      adContent = `
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%); padding: 30px; border-radius: 15px; text-align: center; color: #1a1a2e; font-weight: 500;">
          <h3 style="margin: 0 0 15px 0; color: #1a1a2e;">🚀 Start Earning Today!</h3>
          <p style="margin: 0 0 10px 0; font-size: 16px;">Short links that pay you per click</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Sign up at:<br/>
            <a href="https://www.admaden.com" target="_blank" style="color: #1a1a2e; text-decoration: underline;">AdMaven</a> • 
            <a href="https://www.propellerads.com" target="_blank" style="color: #1a1a2e; text-decoration: underline;">PropellerAds</a> • 
            <a href="https://www.clicksfly.com" target="_blank" style="color: #1a1a2e; text-decoration: underline;">ClicksFly</a>
          </p>
        </div>
      `;
    }
    
    // Serve ad page with redirect
    const adHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinkVault - Redirecting...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', sans-serif; 
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 500px;
      width: 90%;
    }
    .logo { font-size: 32px; margin-bottom: 20px; }
    .logo span { color: #00d4ff; }
    .ad-container {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timer {
      font-size: 48px;
      color: #00d4ff;
      margin: 20px 0;
    }
    .message { color: #aaa; font-size: 14px; }
    .destination {
      margin-top: 20px;
      padding: 15px;
      background: rgba(0,212,255,0.1);
      border-radius: 10px;
      font-size: 12px;
      color: #00d4ff;
    }
    .skip-btn {
      background: transparent;
      border: 1px solid #00d4ff;
      color: #00d4ff;
      padding: 10px 30px;
      border-radius: 25px;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.3s;
    }
    .skip-btn:hover { background: #00d4ff; color: #1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Link<span>Vault</span></div>
    <div class="ad-container">${adContent}</div>
    <div class="timer" id="timer">5</div>
    <p class="message">Please wait...</p>
    <p class="destination">Going to: ${link.originalUrl.substring(0, 40)}...</p>
    <button class="skip-btn" onclick="skipAd()">Skip</button>
  </div>
  <script>
    let countdown = 5;
    const timerEl = document.getElementById('timer');
    const interval = setInterval(() => {
      countdown--;
      timerEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(interval);
        window.location.href = '${link.originalUrl}';
      }
    }, 1000);
    function skipAd() {
      window.location.href = '${link.originalUrl}';
    }
  </script>
</body>
</html>`;
    
    res.send(adHtml);
  } catch (error) {
    logger.error('Redirect error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`LinkVault running on port ${PORT}`));

module.exports = app;
