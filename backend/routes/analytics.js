const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const { authenticateToken } = require('../middleware/auth');

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user.id });
    
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalLinks = links.length;
    const activeLinks = links.filter(l => l.isActive).length;
    
    // Calculate estimated earnings (rough estimate - $5 per 1000 clicks)
    const estimatedEarnings = (totalClicks / 1000) * 5;
    
    // Get clicks per day for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayClicks = links.reduce((sum, link) => {
        return sum + (link.clickDates || []).filter(d => d >= date && d < nextDate).length;
      }, 0);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        clicks: dayClicks
      });
    }
    
    res.json({
      totalClicks,
      totalLinks,
      activeLinks,
      estimatedEarnings: estimatedEarnings.toFixed(2),
      last7Days
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
