const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token;
    
    console.log(' Auth middleware debug:', {
        cookies: req.cookies,
        token: token,
        origin: req.headers.origin,
        NODE_ENV: process.env.NODE_ENV,
        cookieHeader: req.headers.cookie
    });

    if(!token){
        console.log(' No token found, redirecting to login');
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