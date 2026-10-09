
import Startup from '../models/Startup.js';

export async function discoverStartups(req, res, next) {
  try {
    const { search, industry, fundingStage } = req.query;
    const filter = {};

    if (industry && industry !== 'All industries') {
      filter.industry = industry;
    }

    if (fundingStage && fundingStage !== 'All stages') {
      filter.fundingStage = fundingStage;
    }

    if (search?.trim()) {
      filter.$or = [
        { companyName: { $regex: search.trim(), $options: 'i' } },
        { tagline: { $regex: search.trim(), $options: 'i' } },
        { industry: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const startups = await Startup.find(filter)
      .populate('founder', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ startups, count: startups.length });
  } catch (error) {
    next(error);
  }
}
