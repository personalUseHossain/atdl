const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: {
    type: String,
    enum: ['drug', 'health_issue']
  },
  size: Number,
  color: String,
  total_connections: Number
});

const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  label: String,
  value: Number,
  papers: Number,
  relationship: String,
  width: Number,
  has_full_text: Boolean
});

const knowledgeGraphSchema = new mongoose.Schema({
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
  nodes: [nodeSchema],
  edges: [edgeSchema],
  metadata: {
    generated_at: Date,
    total_connections: Number,
    total_drugs: Number,
    total_health_issues: Number
  },
  stats: {
    totalNodes: Number,
    totalEdges: Number,
    drugNodes: Number,
    healthNodes: Number,
    maxDegree: Number,
    avgDegree: Number,
    strengthDistribution: Object,
    density: Number
  },
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

knowledgeGraphSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.KnowledgeGraph || mongoose.model('KnowledgeGraph', knowledgeGraphSchema);