const User = require('../models/User');

exports.awardPoints = async (userId, points) => {
    const user = await User.findById(userId);
    user.points += points;
    if(user.points>=500 && !user.badges.includes("Green Hero")){
        user.badges.push("Green Hero");
    }
    await user.save();
};