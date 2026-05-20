import { Schema, model } from 'mongoose';

export const EMOTIONS = ['happy', 'sad', 'normal', 'fear', 'angry', 'disgust'];
export const CONFIDENCE_LEVELS = ['low', 'medium', 'confident', 'very_confident'];

export const toConfidenceLevel = (confidence) => {
  if (confidence >= 0.85) return 'very_confident';
  if (confidence >= 0.65) return 'confident';
  if (confidence >= 0.40) return 'medium';
  return 'low';
};

const PredictionSnapshotSchema = new Schema(
  {
    emotion:          { type: String, enum: EMOTIONS, required: true },
    confidence:       { type: Number, min: 0, max: 1,   required: true },
    confidencePercent:{ type: Number, min: 0, max: 100, required: true },
    confidenceLevel:  { type: String, enum: CONFIDENCE_LEVELS, required: true },
    meetsThreshold:   { type: Boolean, default: false },
    capturedAt:       { type: Date, default: Date.now },
  },
  { _id: false },
);

const InterviewSessionSchema = new Schema(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status:          { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    score:           { type: Number, min: 0, max: 100, default: null },
    dominantEmotion: { type: String, enum: [...EMOTIONS, null], default: null },
    predictions:     [PredictionSnapshotSchema],
    startedAt:       { type: Date, default: Date.now },
    completedAt:     { type: Date, default: null },
  },
  { timestamps: true },
);

export default model('InterviewSession', InterviewSessionSchema);
