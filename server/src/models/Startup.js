
import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    fundingStage: {
      type: String,
      required: true,
      enum: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
    },
    fundingRequired: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

startupSchema.index({ companyName: 'text', tagline: 'text', description: 'text' });

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;