const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'Plan name cannot exceed 40 characters']
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price (in cents) is required'],
      min: [0, 'Price cannot be negative']
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL'],
      default: 'MONTHLY'
    },
    features: {
      type: [String],
      required: [true, 'Plan features are required'],
      validate: [
        {
          validator: (arr) => arr.length > 0,
          message: 'Plan must have at least one feature'
        }
      ]
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly load active subscription options in catalog
planSchema.index({ status: 1 });

module.exports = mongoose.model('Plan', planSchema);
