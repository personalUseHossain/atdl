import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    // Not required for social login users
    select: false // Don't include password by default in queries
  },
  image: {
    type: String
  },
  emailVerified: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  authMethod: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email'
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
  // Password history for security
  passwordHistory: [{
    password: String, // Hashed password
    changedAt: Date,
    ipAddress: String
  }],
  // For social logins
  accounts: [{
    provider: {
      type: String,
      required: true
    },
    providerAccountId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'oauth'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it exists and is modified
  if (this.password && this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      
      // Update the last entry in password history if it exists
      if (this.passwordHistory && this.passwordHistory.length > 0 && this.isModified('password')) {
        const lastEntry = this.passwordHistory[this.passwordHistory.length - 1];
        if (lastEntry && !lastEntry.password.startsWith('$2')) {
          // If the last entry has plain text, update it with hash
          lastEntry.password = hashedPassword;
        }
      }
      
      this.password = hashedPassword;
    } catch (error) {
      return next(error);
    }
  }
  
  // Update timestamp
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  
  if (typeof next === 'function') {
    next();
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // If user has no password (social login), return false
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has password (for email/password login)
userSchema.methods.hasPassword = function() {
  return !!this.password;
};

// Method to set password (for social login users setting password first time)
userSchema.methods.setPassword = async function(newPassword) {
  this.password = newPassword;
  this.authMethod = 'email'; // Change auth method to email/password
  return this.save();
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;