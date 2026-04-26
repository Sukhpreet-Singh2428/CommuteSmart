const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/mailer');
const tempStorage = require('../utils/tempStorage');

// ── Utility: Hash OTP using sha256 ──────────────────────────────────────────
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ── Email Templates ─────────────────────────────────────────────────────────
const getOtpEmailHtml = (otp, userName, type = 'Password Reset') => `
<!DOCTYPE html><html><body style="margin:0;background:#0a0f0a;font-family:Inter,sans-serif;">
<div style="max-width:480px;margin:40px auto;background:#0d1a0d;border:1px solid #1a2e1a;border-radius:12px;">
  <div style="padding:24px 32px;border-bottom:1px solid #1a2e1a;">
    <span style="color:#00C853;font-size:20px;font-weight:800;">🚌 CommuteSmart</span>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#fff;margin:0 0 8px;">${type} OTP</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Hi ${userName || 'there'}, here is your OTP:</p>
    <div style="background:#0a0f0a;border:1px solid #00C853;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="color:#00C853;font-size:40px;font-weight:800;letter-spacing:14px;">${otp}</div>
      <div style="color:#6b7280;font-size:12px;margin-top:8px;">Valid for 10 minutes only</div>
    </div>
    <p style="color:#6b7280;font-size:13px;">If you didn't request this, ignore this email.</p>
  </div>
</div>
</body></html>`;

// ── Authentication endpoints ────────────────────────────────────────────────
exports.signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists (including OAuth users)
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            // Check if it's an OAuth user
            if (existingUser.googleId || existingUser.githubId || existingUser.authProvider !== 'local') {
                let provider = existingUser.authProvider || 'OAuth';
                if (existingUser.googleId) provider = 'Google';
                else if (existingUser.githubId) provider = 'GitHub';
                
                return res.status(400).json({ 
                    success: false, 
                    message: `This email is already registered via ${provider}. Please use ${provider} sign-in.` 
                });
            }
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Check if there's already a pending registration
        if (tempStorage.hasRegistrationData(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "A registration is already in progress. Please verify your email or wait for it to expire." 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = hashOTP(otp);

        // Store in temporary storage (NOT in database yet)
        tempStorage.storeRegistrationData(email, hashedOtp, hashedPassword, name);

        // Send OTP email
        try {
            await transporter.sendMail({
                from: `"CommuteSmart" <${process.env.EMAIL_USER}>`,
                to: email.toLowerCase().trim(),
                subject: 'CommuteSmart Email Verification OTP',
                html: getOtpEmailHtml(otp, name || 'there', 'Email Verification'),
            });
        } catch (err) {
            console.error('Failed to send verification email:', err);
            // Clean up temporary storage if email fails
            tempStorage.deleteRegistrationData(email);
            return res.status(500).json({ 
                success: false, 
                message: "Failed to send OTP. Please try again later." 
            });
        }

        res.status(200).json({
            success: true,
            requiresVerification: true,
            message: "OTP sent to your email. Please verify to complete registration.",
            email: email.toLowerCase().trim()
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        // Retrieve temporary registration data
        const regData = tempStorage.getRegistrationData(email);
        if (!regData) {
            return res.status(400).json({ 
                success: false, 
                message: 'No pending registration found. OTP may have expired. Please register again.' 
            });
        }

        // Check attempt limit
        if (regData.attempts >= tempStorage.MAX_ATTEMPTS) {
            tempStorage.deleteRegistrationData(email);
            return res.status(400).json({ 
                success: false, 
                message: 'Too many incorrect attempts. Please register again.' 
            });
        }

        // Validate OTP
        const hashedOtp = hashOTP(otp);
        if (hashedOtp !== regData.otp) {
            const attempts = tempStorage.incrementAttempt(email);
            const left = tempStorage.MAX_ATTEMPTS - attempts;
            return res.status(400).json({ 
                success: false, 
                message: `Incorrect OTP. ${left} attempt(s) remaining.` 
            });
        }

        // OTP is correct - create user in database
        const { name, email: userEmail, password } = regData.userData;
        
        // Double-check user doesn't exist (race condition protection)
        const existingUser = await User.findOne({ email: userEmail });
        if (existingUser) {
            tempStorage.deleteRegistrationData(email);
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists. Please login instead.' 
            });
        }

        // Create user
        const user = new User({
            name: name || '',
            email: userEmail,
            password: password,
            emailVerified: true, // Already verified
            authProvider: 'local'
        });
        await user.save();

        // Clean up temporary storage
        tempStorage.deleteRegistrationData(email);

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: "Email verified successfully. Account created!",
            user: {
                id: user._id, 
                name: user.name || '', 
                username: user.username || '',
                email: user.email, 
                bio: user.bio || '', 
                city: user.city || 'Chandigarh',
                profilePhoto: user.profilePhoto || '', 
                points: user.points || 0,
                carbonSaved: user.carbonSaved || 0, 
                badges: user.badges || [],
                honestyScore: user.honestyScore || 100, 
                favourites: user.favourites || [],
                authProvider: user.authProvider
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        // Check if there's pending registration data
        const regData = tempStorage.getRegistrationData(email);
        if (!regData) {
            return res.status(400).json({ 
                success: false, 
                message: 'No pending registration found. Please register again.' 
            });
        }

        // Check cooldown
        if (!tempStorage.canResendOTP(email)) {
            return res.status(429).json({ 
                success: false, 
                message: `Please wait ${tempStorage.COOLDOWN_SECONDS} seconds before requesting another OTP.` 
            });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = hashOTP(otp);

        // Update OTP in temporary storage
        tempStorage.updateOTP(email, hashedOtp);

        // Send OTP email
        try {
            await transporter.sendMail({
                from: `"CommuteSmart" <${process.env.EMAIL_USER}>`,
                to: email.toLowerCase().trim(),
                subject: 'CommuteSmart Email Verification OTP',
                html: getOtpEmailHtml(otp, regData.userData.name || 'there', 'Email Verification'),
            });
        } catch (err) {
            console.error('Failed to send verification email:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send OTP. Please try again later.' 
            });
        }

        res.json({ success: true, message: 'Verification OTP sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // OAuth users without password
        if (!user.password && (user.googleId || user.githubId)) {
             return res.status(400).json({ 
                success: false, 
                message: `This account uses ${user.authProvider || 'OAuth'} sign-in. Please use that button to log in.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Users are now created as verified after OTP verification
        // No need to check emailVerified status

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: "Login Successful",
            user: {
                id: user._id, name: user.name || '', username: user.username || '',
                email: user.email, bio: user.bio || '', city: user.city || 'Chandigarh',
                profilePhoto: user.profilePhoto || '', points: user.points || 0,
                carbonSaved: user.carbonSaved || 0, badges: user.badges || [],
                honestyScore: user.honestyScore || 100, favourites: user.favourites || [],
                authProvider: user.authProvider
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id, name: user.name || '', username: user.username || '',
                email: user.email, bio: user.bio || '', city: user.city || 'Chandigarh',
                profilePhoto: user.profilePhoto || '', points: user.points || 0,
                carbonSaved: user.carbonSaved || 0, badges: user.badges || [],
                honestyScore: user.honestyScore || 100, favourites: user.favourites || [],
                authProvider: user.authProvider
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.logout = async (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });
    res.json({ success: true, message: "Logged out" });
};

// ── Forgot Password Flow ─────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Always return success to prevent email enumeration
        if (!user) return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });

        // OAuth User Handling: detect using googleId/githubId, or legacy dummy password
        const isOAuthLegacy = user.password && user.password.startsWith('oauth-');
        if (user.googleId || user.githubId || (user.authProvider && user.authProvider !== 'local') || isOAuthLegacy) {
            let providerName = 'OAuth';
            if (user.googleId || (user.password && user.password.includes('google'))) providerName = 'Google';
            else if (user.githubId || (user.password && user.password.includes('github'))) providerName = 'GitHub';
            else if (user.authProvider && user.authProvider !== 'local') providerName = user.authProvider;
            
            return res.status(400).json({
                success: false,
                message: `This account uses ${providerName} sign-in. Please use that button to log in.`
            });
        }

        // Rate limit: 1 OTP per 60 seconds
        if (user.resetOtpExpiry && user.resetOtpExpiry > new Date(Date.now() + 9 * 60 * 1000)) { // meaning requested < 1min ago (expiry is +10m)
            return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting another OTP.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = hashOTP(otp);
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.findByIdAndUpdate(user._id, {
            resetOtp: hashedOtp, resetOtpExpiry: expiry, resetOtpAttempts: 0
        });

        await transporter.sendMail({
            from: `"CommuteSmart" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Your CommuteSmart Password Reset OTP',
            html: getOtpEmailHtml(otp, user.name, 'Password Reset'),
        });

        res.json({ success: true, message: 'OTP sent to your registered email.' });
    } catch (err) {
        console.error('forgotPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user?.resetOtp) return res.status(400).json({ success: false, message: 'No pending OTP for this email.' });

        if (user.resetOtpExpiry < new Date()) {
            await User.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        if (user.resetOtpAttempts >= 5) {
            await User.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
            return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
        }

        const hashedOtp = hashOTP(otp);
        if (hashedOtp !== user.resetOtp) {
            await User.findByIdAndUpdate(user._id, { $inc: { resetOtpAttempts: 1 } });
            const left = 4 - user.resetOtpAttempts; // 5 total
            return res.status(400).json({ success: false, message: `Incorrect OTP. ${left} attempt(s) remaining.` });
        }

        // Issue short-lived reset token
        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );
        await User.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });

        res.json({ success: true, resetToken });
    } catch (err) {
        console.error('verifyOtp error:', err.message);
        res.status(500).json({ success: false, message: 'Verification failed.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) return res.status(400).json({ success: false, message: 'Missing required fields' });
        if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

        let decoded;
        try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
        catch { return res.status(400).json({ success: false, message: 'Reset link expired. Please start again.' }); }

        if (decoded.purpose !== 'password-reset') return res.status(400).json({ success: false, message: 'Invalid token.' });

        const hashed = await bcrypt.hash(newPassword, 12); // Use bcrypt for passwords
        await User.findByIdAndUpdate(decoded.userId, { password: hashed });
        res.json({ success: true, message: 'Password updated. You can now log in.' });
    } catch (err) {
        console.error('resetPassword error:', err.message);
        res.status(500).json({ success: false, message: 'Password reset failed.' });
    }
};

// ── OAuth helper ─────────────────────────────────────────────────────────────
exports.buildOAuthRedirect = (user, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userData = encodeURIComponent(JSON.stringify({
        id: user._id, name: user.name, email: user.email,
        points: user.points, carbonSaved: user.carbonSaved,
        badges: Array.isArray(user.badges) ? user.badges : [],
        profilePhoto: user.profilePhoto || '',
        authProvider: user.authProvider,
    }));
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userData}`);
};