const Report = require('../models/Report');
const User = require('../models/User');
const { awardPoints } = require('../utils/gamification');   //? Gamification: Award points for reporting

// Badge checking function — called after createAlert and upvoteAlert (verification)
async function checkAndAwardBadges(userId, io) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const alertCount = await Report.countDocuments({ reportedBy: userId, type: 'alert' });
        // Verified = upvotes array has 5+ entries
        const verifiedCount = await Report.countDocuments({
            reportedBy: userId,
            type: 'alert',
            $expr: { $gte: [{ $size: '$upvotes' }, 5] }
        });

        const badgesToAward = [];

        if (alertCount >= 1 && !user.badges.includes('First Report'))
            badgesToAward.push('First Report');

        if (alertCount >= 10 && !user.badges.includes('Reliable Reporter'))
            badgesToAward.push('Reliable Reporter');

        if (alertCount >= 50 && !user.badges.includes('Community Hero'))
            badgesToAward.push('Community Hero');

        if (verifiedCount >= 5 && !user.badges.includes('Verified Voice'))
            badgesToAward.push('Verified Voice');

        if ((user.carbonSaved || 0) >= 1 && !user.badges.includes('Green Guardian'))
            badgesToAward.push('Green Guardian');

        if ((user.carbonSaved || 0) >= 10 && !user.badges.includes('Eco Champion'))
            badgesToAward.push('Eco Champion');

        if (badgesToAward.length > 0) {
            await User.findByIdAndUpdate(userId, { $push: { badges: { $each: badgesToAward } } });
            if (io) {
                io.to(`user:${userId}`).emit('badge:earned', { badges: badgesToAward });
            }
        }
    } catch (err) {
        console.error('Error checking badges:', err);
    }
}

exports.createAlert = async (req, res) => {
    const { message, lat, long, type, severity, location, area, routeFrom, routeTo } = req.body;
    const userId = req.user.id;

    // Validation
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Alert message is required' });
    }
    if (!req.body.locationText || !req.body.locationText.trim()) {
        return res.status(400).json({ success: false, message: 'Location is required' });
    }
    if (!area || !area.trim()) {
        return res.status(400).json({ success: false, message: 'Area is required' });
    }

    const alert = new Report({
        type: 'alert',
        alertType: type || 'traffic',
        severity: severity || 'medium',
        message: message.trim(),
        location: { type: 'Point', coordinates: [long, lat] },
        locationText: req.body.locationText.trim(),
        transportMode: req.body.transportMode || 'general',
        area: area.trim(),
        routeFrom: routeFrom || '',
        routeTo: routeTo || '',
        reportedBy: userId,
        upvotes: [],
        upvoteCount: 0,
        comments: []
    });

    await alert.save();

    await awardPoints(userId, 10);  //? 10 points for alert 

    //? Carbon saved: each alert = 0.01 kg CO2
    await User.findByIdAndUpdate(userId, {
        $inc: { honestyScore: -2, carbonSaved: 0.01 },
        $set: { lastActiveDate: new Date() }
    });

    const io = req.app.get('io');
    
    // Populate reportedBy for the socket event
    const populatedAlert = await Report.findById(alert._id).populate('reportedBy', 'email name username profilePhoto');
    io.emit('alert:new', populatedAlert);
    // Also emit legacy event name for backward compat
    io.emit('newAlert', populatedAlert);

    // Get updated user for points event
    const updatedUser = await User.findById(userId).select('points carbonSaved badges');
    io.to(`user:${userId}`).emit('points:earned', {
        points: 10,
        reason: 'Alert created',
        total: updatedUser.points
    });

    // Check and award badges
    await checkAndAwardBadges(userId, io);

    res.json({success: true, alert: populatedAlert});
};

exports.getAlerts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const userId = req.user?.id; // Get current user ID if authenticated

    const alertsDocs = await Report.find({type: 'alert'})
        .populate('reportedBy', 'email name username profilePhoto')
        .sort({timeStamp: -1})
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Report.countDocuments({type: 'alert'});

    // Transform upvotes array to integer count and add isLiked flag
    const alerts = alertsDocs.map(alert => ({
        ...alert,
        upvotes: Array.isArray(alert.upvotes) ? alert.upvotes.length : (typeof alert.upvotes === 'number' ? alert.upvotes : 0),
        commentsCount: Array.isArray(alert.comments) ? alert.comments.length : 0,
        isLiked: userId && Array.isArray(alert.upvotes) ? alert.upvotes.some(id => id.toString() === userId.toString()) : false,
    }));

    res.json({
        success: true,
        alerts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

exports.upvoteAlert = async (req, res) => {
    try {
        const alert = await Report.findById(req.params.id);
        if (!alert){
            return res.status(404).json({success: false, message: "Alert not found"});
        }

        // ── CORRUPTION GUARD ──────────────────────────────────────────
        // Fix corrupt upvotes field on this specific document before proceeding
        if (!Array.isArray(alert.upvotes)) {
            alert.upvotes = [];
        }
        // ─────────────────────────────────────────────────────────────

        const userId = req.user.id;
        const io = req.app.get('io');

        // Toggle upvote using array
        const upvotesArray = alert.upvotes;
        const alreadyUpvoted = upvotesArray.some(id => id.toString() === userId);

        if (alreadyUpvoted) {
            // Remove upvote
            alert.upvotes = upvotesArray.filter(id => id.toString() !== userId);
        } else {
            // Add upvote
            alert.upvotes.push(userId);
            
            // Award 2 points to the alert's original reporter (if not self)
            const reporterId = alert.reportedBy.toString();
            if (reporterId !== userId) {
                await User.findByIdAndUpdate(reporterId, { $inc: { points: 2, carbonSaved: 0.005 } });
            }
        }

        alert.upvoteCount = alert.upvotes.length;
        await alert.save();

        //? if 5 upvotes, alert is verified — award bonus to reporter
        if (alert.upvotes.length === 5) {
            const reporterId = alert.reportedBy.toString();
            await User.findByIdAndUpdate(reporterId, {
                $inc: { honestyScore: 5, carbonSaved: 0.04 }
            });
            await awardPoints(reporterId, 25); // 25 points for verification

            const updatedReporter = await User.findById(reporterId).select('points');
            io.to(`user:${reporterId}`).emit('points:earned', {
                points: 25,
                reason: 'Alert verified by community',
                total: updatedReporter.points
            });

            // Check badges for reporter
            await checkAndAwardBadges(reporterId, io);
        }

        // Award verifier points (if not self)
        if (req.user && req.user.id && !alreadyUpvoted) {
            const verifierId = req.user.id;
            if (verifierId !== alert.reportedBy.toString()) {
                await awardPoints(verifierId, 5); // 5 points for verifying
                const updatedVerifier = await User.findById(verifierId).select('points');
                io.to(`user:${verifierId}`).emit('points:earned', {
                    points: 5,
                    reason: 'Verified an alert',
                    total: updatedVerifier.points
                });
            }
        }

        // Emit upvote event to all connected clients
        io.emit('alert:upvoted', {
            alertId: alert._id,
            upvoteCount: alert.upvotes.length,
            upvotes: alert.upvotes
        });

        res.json({
            success: true,
            upvotes: alert.upvotes.length,
            userUpvoted: !alreadyUpvoted
        });
    } catch (err) {
        console.error('upvoteAlert error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/alerts/:id/comments — add a comment
exports.addComment = async (req, res) => {
    try {
        const alert = await Report.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        const { text } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }
        if (text.length > 300) {
            return res.status(400).json({ success: false, message: 'Comment must be under 300 characters' });
        }

        const user = await User.findById(req.user.id).select('name username email');
        const newComment = {
            userId: req.user.id,
            userName: user.username ? `@${user.username}` : (user.name || user.email.split('@')[0]),
            text: text.trim(),
            createdAt: new Date()
        };

        alert.comments.push(newComment);
        await alert.save();

        const io = req.app.get('io');
        io.emit('alert:comment:new', {
            alertId: alert._id,
            comment: newComment,
            totalComments: alert.comments.length
        });

        res.json({
            success: true,
            comment: newComment,
            totalComments: alert.comments.length
        });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/alerts/:id/comments — get comments for an alert
exports.getComments = async (req, res) => {
    try {
        const alert = await Report.findById(req.params.id).select('comments');
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        // Sort comments by createdAt desc
        const comments = (alert.comments || []).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json({ success: true, comments });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/alerts/:alertId/comments/:commentId — delete own comment
exports.deleteComment = async (req, res) => {
    try {
        const { alertId, commentId } = req.params;
        const userId = req.user.id;

        const alert = await Report.findById(alertId);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        // Find the comment
        const comment = alert.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Verify ownership
        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
        }

        // Remove comment using pull
        alert.comments.pull(commentId);
        await alert.save();

        const io = req.app.get('io');
        io.emit('alert:comment:deleted', {
            alertId: alert._id,
            commentId: commentId,
            totalComments: alert.comments.length
        });

        res.json({
            success: true,
            message: 'Comment deleted successfully',
            totalComments: alert.comments.length
        });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// CONNECTED TO BACKEND: Get nearby alerts within radius
exports.getNearbyAlerts = async (req, res) => {
    const { lat, long, radius = 8 } = req.query;
    
    if (!lat || !long) {
        return res.status(400).json({success: false, message: "Latitude and longitude are required"});
    }

    try {
        const alerts = await Report.find({
            type: 'alert',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(long), parseFloat(lat)]
                    },
                    $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
                }
            }
        })
        .populate('reportedBy', 'email name username profilePhoto')
        .sort({timeStamp: -1})
        .limit(50);

        res.json({success: true, alerts});
    } catch (error) {
        console.error('Error fetching nearby alerts:', error);
        res.status(500).json({success: false, message: "Failed to fetch nearby alerts"});
    }
};

// CONNECTED TO BACKEND: Delete own alert
exports.deleteAlert = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const alert = await Report.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({success: false, message: "Alert not found"});
        }

        // Check if user owns this alert
        if (alert.reportedBy.toString() !== userId) {
            return res.status(403).json({success: false, message: "You can only delete your own alerts"});
        }

        await Report.findByIdAndDelete(req.params.id);
        
        res.json({success: true, message: "Alert deleted successfully"});
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({success: false, message: "Failed to delete alert"});
    }
};

// CONNECTED TO BACKEND: Get route-specific alerts with proximity checking
exports.getRouteAlerts = async (req, res) => {
    const { startLat, startLong, endLat, endLong, radius = 8 } = req.query;
    
    if (!startLat || !startLong || !endLat || !endLong) {
        return res.status(400).json({success: false, message: "Start and end coordinates are required"});
    }

    try {
        // Calculate route corridor center points (simplified - using midpoint and multiple points along route)
        const routePoints = [];
        const steps = 10; // Check 10 points along the route
        
        for (let i = 0; i <= steps; i++) {
            const lat = parseFloat(startLat) + (parseFloat(endLat) - parseFloat(startLat)) * (i / steps);
            const long = parseFloat(startLong) + (parseFloat(endLong) - parseFloat(startLong)) * (i / steps);
            routePoints.push([long, lat]); // MongoDB expects [longitude, latitude]
        }

        // Find alerts near any point on the route corridor
        const alerts = await Report.find({
            type: 'alert',
            $or: routePoints.map(point => ({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: point
                        },
                        $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
                    }
                }
            }))
        })
        .populate('reportedBy', 'email name username profilePhoto')
        .sort({timeStamp: -1})
        .limit(50);

        // Remove duplicates (alerts that might be near multiple route points)
        const uniqueAlerts = alerts.filter((alert, index, self) => 
            index === self.findIndex((a) => a._id.toString() === alert._id.toString())
        );

        res.json({success: true, alerts: uniqueAlerts});
    } catch (error) {
        console.error('Error fetching route alerts:', error);
        res.status(500).json({success: false, message: "Failed to fetch route alerts"});
    }
};