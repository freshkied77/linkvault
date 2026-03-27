const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token required' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: 'Auth error' });
  }
};

module.exports = { authenticateToken };
