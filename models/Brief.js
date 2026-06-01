import mongoose from 'mongoose';

const briefSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  markdown: {
    type: String,
    required: true
  },
  bucket: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

const Brief = mongoose.model('Brief', briefSchema);
export default Brief;
