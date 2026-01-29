

const mongoose = require('mongoose');

const workerInstanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  query: {
    type: String,
    required: true
  },
  maxPapers: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['idle', 'running', 'completed', 'error', 'stopped'],
    default: 'idle'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentStep: String,
  error: String,
  results: {
    totalPapers: Number,
    totalConnections: Number,
    uniqueConnections: Number,
    duration: Number,
    startedAt: Date,
    completedAt: Date
  },
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success']
    }
  }],
  metadata: {
    ip: String,
    userAgent: String,
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastHeartbeat: Date
  },
  dataFiles: {
    connectionsFile: String,
    knowledgeGraphFile: String,
    processedPapersFile: String,
    processingHistoryFile: String,
    cacheDir: String
  }
}, {
  timestamps: true
});

// Define indexes separately to avoid duplicates
workerInstanceSchema.index({ user: 1, status: 1 });
workerInstanceSchema.index({ 'metadata.startedAt': -1 });
// Remove this duplicate index since sessionId already has unique: true
// workerInstanceSchema.index({ sessionId: 1 });

module.exports = mongoose.models.WorkerInstance || mongoose.model('WorkerInstance', workerInstanceSchema);