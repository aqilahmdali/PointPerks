const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pointsHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earned', 'spent', 'refunded', 'bonus'],
    required: true,
  },
  points: { type: Number, required: true },
  description: { type: String, required: true },
  reference: { type: String }, // voucher code, referral code, etc.
  referenceModel: { type: String, enum: ['Voucher', 'Redemption', null] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Points system
  points: { type: Number, default: 0, min: 0 },
  pointsHistory: [pointsHistorySchema],

  // Referral system
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },

  // Meta
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: total redemptions
userSchema.virtual('redemptions', {
  ref: 'Redemption',
  localField: '_id',
  foreignField: 'user',
});

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: add points with history
userSchema.methods.addPoints = async function (points, description, type = 'earned', reference = null) {
  this.points += points;
  this.pointsHistory.push({ type, points, description, reference });
  return this.save();
};

// Method: spend points
userSchema.methods.spendPoints = async function (points, description, reference = null) {
  if (this.points < points) throw new Error('Insufficient points');
  this.points -= points;
  this.pointsHistory.push({ type: 'spent', points: -points, description, reference });
  return this.save();
};

// Index for performance. Unique fields above already create their own indexes.
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
