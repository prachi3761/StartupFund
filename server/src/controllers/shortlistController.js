
import Shortlist from '../models/Shortlist.js';
import Startup from '../models/Startup.js';

export async function getShortlist(req, res, next) {
  try {
    const items = await Shortlist.find({ investor: req.user._id })
      .populate({
        path: 'startup',
        populate: { path: 'founder', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json({ shortlist: items });
  } catch (error) {
    next(error);
  }
}

export async function addToShortlist(req, res, next) {
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({
        message: 'Only investors can shortlist startups.',
      });
    }

    const startup = await Startup.findById(req.params.startupId);

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found.' });
    }

    const item = await Shortlist.findOneAndUpdate(
      { investor: req.user._id, startup: startup._id },
      { $setOnInsert: { investor: req.user._id, startup: startup._id } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Startup saved.', item });
  } catch (error) {
    next(error);
  }
}

export async function removeFromShortlist(req, res, next) {
  try {
    const item = await Shortlist.findOneAndDelete({
      investor: req.user._id,
      startup: req.params.startupId,
    });

    if (!item) {
      return res.status(404).json({
        message: 'Startup was not in your shortlist.',
      });
    }

    res.json({ message: 'Startup removed from shortlist.' });
  } catch (error) {
    next(error);
  }
}
