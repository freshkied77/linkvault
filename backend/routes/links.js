const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Link = require('../models/Link');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const createLinkSchema = Joi.object({
  originalUrl: Joi.string().uri().required(),
  title: Joi.string().optional(),
  customShortCode: Joi.string().optional(),
  password: Joi.string().optional(),
  expiresAt: Joi.date().optional()
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createLinkSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Check if custom short code is available
    if (value.customShortCode) {
      const existing = await Link.findOne({ shortCode: value.customShortCode });
      if (existing) return res.status(400).json({ error: 'Short code already taken' });
      value.shortCode = value.customShortCode;
    }

    value.userId = req.user.id;
    const link = new Link(value);
    await link.save();

    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const link = await Link.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!link) return res.status(404).json({ error: 'Link not found' });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
