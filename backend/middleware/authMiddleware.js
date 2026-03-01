const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({success: false, message: "Not authorized"});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = jwt.decoded;
        req.user = {id: decoded.id};
        next();
    } catch(err){
        res.status(401).json({success: false, message: "Token expired or invalid"});
    }
};

module.exports = {protect};