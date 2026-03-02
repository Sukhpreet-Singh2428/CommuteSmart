const Report = require('../models/Report');

exports.reportLocation = async (req, res) => {
  try {
    let { lat, long, vehicleId } = req.body;

    // Safety check - convert to number and validate
    lat = parseFloat(lat);
    long = parseFloat(long);

    if (isNaN(lat) || isNaN(long)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude received from frontend"
      });
    }

    const report = new Report({
      type: 'location',
      location: { 
        type: 'Point', 
        coordinates: [long, lat]   // Note: MongoDB expects [longitude, latitude]
      },
      vehicleId: vehicleId || "Unknown-Bus"
    });

    const userId = req.user.id;   //? From auth middleware
    report.reportedBy = userId;
    await report.save();

    // Broadcast to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('locationUpdate', { 
        vehicleId: report.vehicleId, 
        lat, 
        long 
      });
    }

    res.json({ 
      success: true, 
      message: "Location reported successfully",
      report 
    });
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNearby = async (req, res) => {
  try {
    let { lat, long } = req.query;

    lat = parseFloat(lat);
    long = parseFloat(long);

    if (isNaN(lat) || isNaN(long)) {
      return res.status(400).json({ success: false, message: "Invalid lat or long in query" });
    }

    const buses = await Report.find({
      type: 'location',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [long, lat] },
          $maxDistance: 8000
        }
      }
    }).sort({ timestamp: -1 }).limit(20);

    res.json({ 
      success: true, 
      count: buses.length,
      buses 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};