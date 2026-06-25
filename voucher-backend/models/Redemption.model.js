const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true,
  },

  // Unique redemption code (generated at redemption time)
  redemptionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },

  // QR code data (base64 or URL)
  qrCodeData: { type: String },

  // Points used for this redemption
  pointsUsed: { type: Number, default: 0, min: 0 },

  // Status lifecycle
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active',
  },

  // Usage tracking
  usedAt: { type: Date },
  expiresAt: { type: Date, required: true },

  // Snapshot of voucher data at time of redemption (for history accuracy)
  voucherSnapshot: {
    title: String,
    description: String,
    merchant: String,
    category: String,
    discountType: String,
    discountValue: Number,
  },

  // PDF
  pdfUrl: { type: String },

  notes: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: is still valid
redemptionSchema.virtual('isValid').get(function () {
  return this.status === 'active' && this.expiresAt > new Date();
});

// Auto-expire: check status
redemptionSchema.pre('find', function () {
  // Auto-mark expired on query (hook approach)
});

// Indexes
redemptionSchema.index({ user: 1, createdAt: -1 });
redemptionSchema.index({ voucher: 1 });
redemptionSchema.index({ status: 1 });
redemptionSchema.index({ user: 1, voucher: 1 }); // For "already redeemed" check

module.exports = mongoose.model('Redemption', redemptionSchema);
