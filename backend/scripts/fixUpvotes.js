/**
 * One-time migration: fix corrupted upvotes/comments fields in reports collection
 * Run: node backend/scripts/fixUpvotes.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Use raw driver to bypass Mongoose schema casting entirely
  const db = mongoose.connection.db;

  // Auto-detect collection name: try 'reports' first, then 'alerts'
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  const collectionName = names.includes('reports') ? 'reports'
                       : names.includes('alerts')  ? 'alerts'
                       : null;

  if (!collectionName) {
    console.error('Could not find reports or alerts collection. Collections found:', names);
    process.exit(1);
  }
  console.log(`Using collection: ${collectionName}`);

  const col = db.collection(collectionName);

  // Fix upvotes: set to [] wherever it is not already an array
  const upvotesResult = await col.updateMany(
    { upvotes: { $not: { $type: 'array' } } },
    { $set: { upvotes: [] } }
  );
  console.log(`Fixed upvotes on ${upvotesResult.modifiedCount} document(s)`);

  // Fix comments: set to [] wherever it is not already an array
  const commentsResult = await col.updateMany(
    { comments: { $not: { $type: 'array' } } },
    { $set: { comments: [] } }
  );
  console.log(`Fixed comments on ${commentsResult.modifiedCount} document(s)`);

  console.log('Migration complete. Restart the backend server now.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
