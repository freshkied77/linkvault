const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

const linkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  originalUrl: { type: String, required: true },
  shortCode: { type: String, unique: true, default: () => nanoid() },
  title: { type: String, default: '' },
  clicks: { type: Number, default: 0 },
  clickDates: [{ type: Date }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  password: { type: String } // Optional password protection
}, { timestamps: true });

linkSchema.index({ shortCode: 1 });
linkSchema.index({ userId: 1 });

module.exports = mongoose.model('Link', linkSchema);
