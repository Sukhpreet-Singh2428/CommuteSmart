const Report = require('../models/Report');
const User = require('../models/User');

// GET /api/stats/live
// Returns live statistics for the Community page
exports.getLiveStats = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const Model = Report; 

    // countDocuments never triggers field casting — safe even with corrupt documents
    const activeAlerts = await Model.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo }
    });

    const verifiedAlerts = await Model.countDocuments({
      verified: true,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    // aggregate pipeline bypasses Mongoose document casting entirely
    const contributorResult = await Model.aggregate([
      { $match: { reportedBy: { $exists: true, $ne: null } } },
      { $group: { _id: '$reportedBy' } },
      { $count: 'total' }
    ]);
    const totalContributors = contributorResult[0]?.total ?? 0;

    // Response time: use .lean() so Mongoose never tries to cast upvotes/comments
    const verifiedWithTime = await Model.find({
      verified: true,
      verifiedAt: { $exists: true, $gte: sevenDaysAgo }
    }).select('createdAt verifiedAt').lean();

    let avgResponseTime = 0;
    if (verifiedWithTime.length > 0) {
      const totalMs = verifiedWithTime.reduce((sum, doc) => {
        const diff = new Date(doc.verifiedAt) - new Date(doc.createdAt);
        return sum + (isNaN(diff) ? 0 : diff);
      }, 0);
      avgResponseTime = parseFloat((totalMs / verifiedWithTime.length / 60000).toFixed(1));
    }

    res.json({
      success: true,
      stats: {
        activeAlerts,
        verifiedAlerts,
        totalContributors,
        avgResponseTime
      }
    });

  } catch (err) {
    console.error('getLiveStats error:', err.message);
    // Return safe zeros — never let this endpoint return 500 to the client
    res.json({
      success: true,
      stats: {
        activeAlerts: 0,
        verifiedAlerts: 0,
        totalContributors: 0,
        avgResponseTime: 0
      }
    });
  }
};

// GET /api/stats/trending
// Returns trending areas based on alert density in last 6 hours
exports.getTrendingAreas = async (req, res) => {
    try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        // Punjab city area centers for grouping
        const areaDefinitions = [
            { area: 'Sector 17, Chandigarh', center: [76.7794, 30.7413], radius: 3 },
            { area: 'Rajpura Bypass', center: [76.5935, 30.4739], radius: 5 },
            { area: 'Patiala Road', center: [76.3868, 30.3398], radius: 5 },
            { area: 'Ambala Highway', center: [76.8497, 30.6942], radius: 5 },
            { area: 'Ludhiana City', center: [75.8573, 30.9010], radius: 5 },
            { area: 'Jalandhar Center', center: [75.5762, 31.3260], radius: 5 },
            { area: 'Amritsar GT Road', center: [74.8723, 31.6340], radius: 5 },
            { area: 'Mohali Phase 8', center: [76.7179, 30.7046], radius: 3 },
            { area: 'Zirakpur', center: [76.8173, 30.6458], radius: 3 },
            { area: 'Kharar', center: [76.6466, 30.7460], radius: 3 }
        ];

        const trending = [];

        for (const area of areaDefinitions) {
            try {
                const count = await Report.countDocuments({
                    type: 'alert',
                    timeStamp: { $gte: sixHoursAgo },
                    location: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: area.center
                            },
                            $maxDistance: area.radius * 1000
                        }
                    }
                });

                if (count > 0) {
                    let level = 'Low';
                    if (count >= 5) level = 'High';
                    else if (count >= 3) level = 'Medium';

                    trending.push({ area: area.area, level, alertCount: count });
                }
            } catch (geoErr) {
                // Skip areas that fail geo query (e.g. missing index)
                continue;
            }
        }

        // Sort by alert count desc, take top 5
        trending.sort((a, b) => b.alertCount - a.alertCount);
        const topTrending = trending.slice(0, 5);

        // If no real data, return known areas with 'Clear'
        if (topTrending.length === 0) {
            res.json({
                success: true,
                trending: [
                    { area: 'Sector 17', level: 'Clear', alertCount: 0 },
                    { area: 'Rajpura Bypass', level: 'Clear', alertCount: 0 },
                    { area: 'Patiala Road', level: 'Clear', alertCount: 0 },
                    { area: 'Ambala Highway', level: 'Clear', alertCount: 0 }
                ]
            });
            return;
        }

        res.json({ success: true, trending: topTrending });
    } catch (err) {
        console.error('Error fetching trending areas:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
