const Report = require('../models/Report');
const User = require('../models/User');

exports.createAlert = async (req, res) => {
    const {message, lat, long} = req.body;
    const userId = req.user.id;

    const alert = new Report({
        type: 'alert',
        message,
        location: {type: 'Point', coordinates: [long, lat]},
        reportedBy: userId
    });

    await alert.save();

    //? Reduce honesty score slightly for every report
    await User.findByIdAndUpdate(userId, {$inc: {honestyScore: -2}});

    const io = req.app.get('io');
    io.emit('newAlert', alert);

    res.json({success: true, alert});
};

exports.getAlerts = async (req, res) => {
    const alerts = await Report.find({type: 'alert'}).sort({timestamp: -1}).limit(20);
    res.json({success: true, alerts});
};

exports.upvoteAlert = async (req, res) => {
    const alert = await Report.findById(req.params.id);
    if (!alert){
        return res.status(404).json({success: false, message: "Alert not found"});
    }

    alert.upvotes += 1;
    await alert.save();

    //? if many upvotes, increase reporter's honesty score
    if (alert.upvotes > 5){
        await User.findByIdAndUpdate(alert.reportedBy, {$inc: {honestyScore: 5}});
    }

    res.json({success: true, alert});
};