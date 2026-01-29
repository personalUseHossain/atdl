const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  workspace: {
    name: String,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  preferences: {
    defaultMaxPapers: {
      type: Number,
      default: 30
    },
    defaultSearchQuery: {
      type: String,
      default: "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)"
    }
  },
  stats: {
    totalSearches: {
      type: Number,
      default: 0
    },
    totalPapersProcessed: {
      type: Number,
      default: 0
    },
    totalConnectionsFound: {
      type: Number,
      default: 0
    },
    lastActive: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);