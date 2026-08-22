require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../database/models/User');
const { ADMIN_RANKS } = require('../utils/admin/user');

async function run() {
  const username = process.argv[2];
  const rank = process.argv[3];
  if (!username || !ADMIN_RANKS.includes(rank)) {
    console.error('Usage: node server/scripts/set-rank.js <username> <user|mod|admin>');
    process.exit(1);
  }

  const uri = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/bloxywild';
  await mongoose.connect(uri);

  const user = await User.findOneAndUpdate(
    { username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    { $set: { rank } },
    { new: true }
  ).select('username rank').lean();

  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  console.log(`Set ${user.username} rank to ${user.rank}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
