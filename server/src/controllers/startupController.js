
import Startup from '../models/Startup.js';

const allowedFields = [
  'companyName',
  'tagline',
  'description',
  'industry',
  'fundingStage',
  'fundingRequired',
  'location',
  'website',
];

export async function createStartup(req, res, next) {
  try {
    if (req.user.role !== 'founder') {
      return res.status(403).json({
        message: 'Only founders can create startup profiles.',
      });
    }

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    const startup = await Startup.create({
      ...data,
      founder: req.user._id,
    });

    return res.status(201).json({ startup });
  } catch (error) {
    next(error);
  }
}

export async function getMyStartups(req, res, next) {
  try {
    const startups = await Startup.find({ founder: req.user._id })
      .sort({ createdAt: -1 });

    return res.json({ startups });
  } catch (error) {
    next(error);
  }
}

export async function getStartupById(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('founder', 'name email');

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found.' });
    }

    return res.json({ startup });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid startup ID.' });
    }
    next(error);
  }
}

export async function updateStartup(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found.' });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only edit your own startups.',
      });
    }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        startup.set(field, req.body[field]);
      }
    }

    await startup.save();
    return res.json({ startup });
  } catch (error) {
    next(error);
  }
}

export async function deleteStartup(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found.' });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only delete your own startups.',
      });
    }

    await startup.deleteOne();
    return res.json({ message: 'Startup deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
