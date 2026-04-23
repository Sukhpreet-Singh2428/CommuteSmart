/**
 * Production migration: fix all fields that should be arrays but are stored as scalars
 * Run locally against production DB:
 *   MONGO_URI=<your-production-uri> node backend/scripts/fixCorruptArrayFields.js
 * OR set it in .env and run:
 *   node backend/scripts/fixCorruptArrayFields.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  if (!uri) {
    console.error('ERROR: No MongoDB URI found. Set MONGO_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri.replace(/\/\/.*@/, '//***@'));

  const db = mongoose.connection.db;

  // ── FIX USERS COLLECTION ──────────────────────────────────────────────────
  // Fields that must be arrays on User documents: badges, favourites, upvotes (if exists)
  const usersCol = db.collection('users');

  const userArrayFields = ['badges', 'favourites', 'upvotes'];
  for (const field of userArrayFields) {
    const result = await usersCol.updateMany(
      { [field]: { $not: { $type: 'array' } }, [field]: { $exists: true } },
      { $set: { [field]: [] } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Users.${field}: fixed ${result.modifiedCount} document(s)`);
    } else {
      console.log(`Users.${field}: no corrupt documents found`);
    }
  }

  // Also fix users where badges/favourites field is completely missing (add empty array)
  for (const field of ['badges', 'favourites']) {
    const result = await usersCol.updateMany(
      { [field]: { $exists: false } },
      { $set: { [field]: [] } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Users.${field}: added missing field to ${result.modifiedCount} document(s)`);
    }
  }

  // ── FIX REPORTS / ALERTS COLLECTION ──────────────────────────────────────
  // Auto-detect collection name
  const collections = await db.listCollections().toArray();
  const collNames = collections.map(c => c.name);
  console.log('Collections found:', collNames.join(', '));

  const reportCollName = collNames.includes('reports') ? 'reports'
                       : collNames.includes('alerts')  ? 'alerts'
                       : null;

  if (!reportCollName) {
    console.warn('WARNING: No reports or alerts collection found — skipping');
  } else {
    console.log(`Using collection: ${reportCollName}`);
    const reportsCol = db.collection(reportCollName);

    const reportArrayFields = ['upvotes', 'comments'];
    for (const field of reportArrayFields) {
      const result = await reportsCol.updateMany(
        { [field]: { $not: { $type: 'array' } }, [field]: { $exists: true } },
        { $set: { [field]: [] } }
      );
      if (result.modifiedCount > 0) {
        console.log(`${reportCollName}.${field}: fixed ${result.modifiedCount} document(s)`);
      } else {
        console.log(`${reportCollName}.${field}: no corrupt documents found`);
      }
    }

    // Add missing array fields to any documents that lack them
    for (const field of ['upvotes', 'comments']) {
      const result = await reportsCol.updateMany(
        { [field]: { $exists: false } },
        { $set: { [field]: [] } }
      );
      if (result.modifiedCount > 0) {
        console.log(`${reportCollName}.${field}: added missing field to ${result.modifiedCount} document(s)`);
      }
    }
  }

  console.log('\n✅ Migration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
