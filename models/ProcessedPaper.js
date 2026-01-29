const mongoose = require('mongoose');

const processedPaperSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pmid: {
    type: String,
    required: true,
    index: true
  },
  title: String,
  journal: String,
  year: Number,
  has_full_text: Boolean,
  connections_found: Number,
  processed: {
    type: Boolean,
    default: false
  },
  error: String,
  processed_at: {
    type: Date,
    default: Date.now
  },
  paper_data: {
    // Store the full paper data for reference
    abstract: String,
    authors: [{
      lastName: String,
      foreName: String,
      initials: String,
      affiliation: String
    }],
    keywords: [String],
    doi: String,
    pmcId: String,
    meshTerms: [Object]
  }
});

// Compound index for unique paper per user
processedPaperSchema.index({ user: 1, pmid: 1 }, { unique: true });

module.exports = mongoose.models.ProcessedPaper || mongoose.model('ProcessedPaper', processedPaperSchema);