const mongoose = require('mongoose');

const pricingLogSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required']
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required']
    },
    oldPrice: {
      type: Number,
      required: [true, 'Old price is required']
    },
    newPrice: {
      type: Number,
      required: [true, 'New price is required']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who changed price is required']
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Index to pull recent price modifications sorted by date
pricingLogSchema.index({ changedAt: -1 });

module.exports = mongoose.model('PricingLog', pricingLogSchema);
