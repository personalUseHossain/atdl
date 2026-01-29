const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workerInstance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerInstance',
    index: true
  },
  // Connection data
  drug: {
    type: String,
    required: true,
    index: true
  },
  health_issue: {
    type: String,
    required: true,
    index: true
  },
  relationship: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'inconclusive'],
    default: 'neutral'
  },
  mechanism: String,
  study_type: String,
  model: String,
  dose: String,
  duration: String,
  sample_size: String,
  statistical_significance: String,
  confidence: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  source_in_paper: String,
  
  // Paper metadata
  paper_id: String,
  paper_title: String,
  paper_year: Number,
  paper_journal: String,
  paper_authors: [{
    // Store as array of objects, not array of strings
    lastName: String,
    foreName: String,
    initials: String,
    affiliation: String
  }],
  paper_doi: String,
  paper_pmc_id: String,
  
  // Processing info
  has_full_text: Boolean,
  extracted_at: Date,
  extraction_source: String,
  is_mock: {
    type: Boolean,
    default: false
  },
  
  // Aggregated data for this specific connection
  supporting_papers: [String],
  total_papers: {
    type: Number,
    default: 1
  },
  first_paper_year: Number,
  latest_paper_year: Number,
  extraction_sources: [String],
  has_full_text_sources: {
    type: Number,
    default: 0
  },
  relationships: [String],
  
  // Strength calculation
  strength: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique drug-health issue pairs per user
connectionSchema.index({ user: 1, drug: 1, health_issue: 1 }, { unique: true });

// Text search index
connectionSchema.index({ drug: 'text', health_issue: 'text', mechanism: 'text' });

module.exports = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);