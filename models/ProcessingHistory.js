const mongoose = require('mongoose');

const processingHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workerInstance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerInstance'
  },
  query: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  stats: {
    total_papers_processed: Number,
    new_connections_found: Number,
    unique_connections_total: Number,
    duration_seconds: Number
  },
  cache_stats: {
    papers_cached: Number,
    full_text_cached: Number,
    papers_processed: Number,
    papers_with_full_text: Number
  },
  status: {
    type: String,
    enum: ['completed', 'error', 'stopped'],
    default: 'completed'
  }
});

processingHistorySchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.models.ProcessingHistory || mongoose.model('ProcessingHistory', processingHistorySchema);