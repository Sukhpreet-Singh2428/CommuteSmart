/**
 * Migration Script: Fix username null values
 * 
 * This script safely updates all users with username: null to have undefined username.
 * This prevents duplicate key errors since the username field is unique with sparse: true.
 * 
 * Usage: node backend/scripts/fixUsernameNull.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const fixUsernameNull = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding users with username: null...');
    const usersWithNullUsername = await User.find({ username: null });
    console.log(`📊 Found ${usersWithNullUsername.length} users with username: null`);
    
    if (usersWithNullUsername.length === 0) {
      console.log('✅ No users need fixing. Exiting.');
      process.exit(0);
    }
    
    console.log('🔧 Updating users to remove null username values...');
    let updatedCount = 0;
    
    for (const user of usersWithNullUsername) {
      try {
        await User.findByIdAndUpdate(user._id, { $unset: { username: "" } });
        updatedCount++;
        console.log(`✅ Updated user: ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to update user ${user.email}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} out of ${usersWithNullUsername.length} users`);
    console.log('🎉 Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    process.exit(1);
  }
};

fixUsernameNull();
