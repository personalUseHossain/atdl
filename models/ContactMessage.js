// models/ContactMessage.js
import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: [
      'General Inquiry',
      'Technical Support',
      'Sales Question',
      'Partnership',
      'Feedback',
      'Other'
    ]
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Update timestamp on save - FIXED VERSION
contactMessageSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Create index for faster queries
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ createdAt: -1 });

// Optionally, you can also add a pre-update middleware
contactMessageSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

const ContactMessage = mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;