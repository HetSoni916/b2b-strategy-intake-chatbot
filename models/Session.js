import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  founderName: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    default: 'Stealth Startup'
  },
  personaName: {
    type: String,
    default: null
  },
  currentQuestion: {
    type: String,
    default: ''
  },
  currentQuestionIndex: {
    type: Number,
    default: 1
  },
  questionsAsked: {
    type: [String],
    default: []
  },
  bucket: {
    type: String,
    enum: ['GTM', 'Sales', 'Pricing', 'Brand', 'Ops', 'Unclassified'],
    default: 'Unclassified'
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
