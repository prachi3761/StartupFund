
import mongoose from 'mongoose';

const shortlistSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
  },
  { timestamps: true }
);

shortlistSchema.index({ investor: 1, startup: 1 }, { unique: true });

const Shortlist = mongoose.model('Shortlist', shortlistSchema);

export default Shortlist;


