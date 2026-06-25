const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each user can only be referred once
  },
  referralCode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed',
  },
  rewardPoints: {
    type: Number,
    required: true,
    default: 50,
  },
  // Whether the reward was already credited
  rewardCredited: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

referralSchema.index({ referrer: 1 });
referralSchema.index({ referralCode: 1 });

module.exports = mongoose.model('Referral', referralSchema);
