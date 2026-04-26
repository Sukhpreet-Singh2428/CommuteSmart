/**
 * Temporary Storage for Registration OTP and User Data
 * 
 * This in-memory storage holds pending registration data until OTP verification.
 * For production, consider upgrading to Redis for persistence and scalability.
 * 
 * Data structure:
 * Map<email, {
 *   otp: string (hashed),
 *   expiry: Date,
 *   attempts: number,
 *   lastRequest: Date,
 *   userData: { name, email, password (hashed) }
 * }>
 */

const tempStorage = new Map();

const EXPIRY_MINUTES = 10;
const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Store registration data with OTP
 */
const storeRegistrationData = (email, hashedOtp, hashedPassword, name) => {
  const expiry = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);
  
  tempStorage.set(email.toLowerCase().trim(), {
    otp: hashedOtp,
    expiry,
    attempts: 0,
    lastRequest: new Date(),
    userData: {
      name: name || '',
      email: email.toLowerCase().trim(),
      password: hashedPassword
    }
  });
  
  console.log(`📝 Stored temporary registration data for: ${email}`);
};

/**
 * Retrieve registration data by email
 */
const getRegistrationData = (email) => {
  const data = tempStorage.get(email.toLowerCase().trim());
  if (!data) return null;
  
  // Check if expired
  if (data.expiry < new Date()) {
    tempStorage.delete(email.toLowerCase().trim());
    console.log(`⏰ Expired registration data removed for: ${email}`);
    return null;
  }
  
  return data;
};

/**
 * Delete registration data by email
 */
const deleteRegistrationData = (email) => {
  const deleted = tempStorage.delete(email.toLowerCase().trim());
  if (deleted) {
    console.log(`🗑️ Deleted temporary registration data for: ${email}`);
  }
  return deleted;
};

/**
 * Check if registration data exists for email
 */
const hasRegistrationData = (email) => {
  const data = getRegistrationData(email);
  return data !== null;
};

/**
 * Increment OTP attempt counter
 */
const incrementAttempt = (email) => {
  const data = getRegistrationData(email);
  if (!data) return false;
  
  data.attempts += 1;
  tempStorage.set(email.toLowerCase().trim(), data);
  return data.attempts;
};

/**
 * Check cooldown for resend
 */
const canResendOTP = (email) => {
  const data = getRegistrationData(email);
  if (!data) return true; // No data exists, can send
  
  const cooldownEnd = new Date(data.lastRequest.getTime() + COOLDOWN_SECONDS * 1000);
  return new Date() >= cooldownEnd;
};

/**
 * Update OTP for resend
 */
const updateOTP = (email, hashedOtp) => {
  const data = getRegistrationData(email);
  if (!data) return false;
  
  data.otp = hashedOtp;
  data.expiry = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);
  data.attempts = 0;
  data.lastRequest = new Date();
  
  tempStorage.set(email.toLowerCase().trim(), data);
  console.log(`🔄 Updated OTP for: ${email}`);
  return true;
};

/**
 * Cleanup expired entries (call periodically)
 */
const cleanupExpired = () => {
  const now = new Date();
  let cleaned = 0;
  
  for (const [email, data] of tempStorage.entries()) {
    if (data.expiry < now) {
      tempStorage.delete(email);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired registration entries`);
  }
  
  return cleaned;
};

// Auto-cleanup every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

module.exports = {
  storeRegistrationData,
  getRegistrationData,
  deleteRegistrationData,
  hasRegistrationData,
  incrementAttempt,
  canResendOTP,
  updateOTP,
  cleanupExpired,
  MAX_ATTEMPTS,
  EXPIRY_MINUTES,
  COOLDOWN_SECONDS
};
