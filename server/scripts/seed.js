require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Box = require('../database/models/Box');
const Rain = require('../database/models/Rain');
const Setting = require('../database/models/Setting');
const cases = require('../data/cases-data.json');
const drops = require('../data/drops-data.json');

async function run() {
  const uri = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/bloxywild';
  await mongoose.connect(uri);
  console.log('Connected', uri);

  await Box.deleteMany({});
  await Setting.deleteMany({});
  const docs = cases.map((c) => {
    const items = (drops[c.slug] || []).map((d) => {
      const item = {
        name: d.name,
        image: `/cdn/items/${d.id}.webp`,
        amountFixed: Math.round(d.value * 1000),
        dropId: d.id,
        color: d.color
      };
      return {
        ...item,
        item,
        minTicket: d.minTicket,
        maxTicket: d.maxTicket,
        tickets: d.maxTicket - d.minTicket + 1
      };
    });
    return {
      name: c.name,
      slug: c.slug,
      amount: Math.round(c.price * 1000),
      levelMin: 0,
      items,
      categories: [c.risk],
      type: 'case',
      state: 'active'
    };
  }).filter((d) => d.items.length > 0);

  await Box.insertMany(docs);
  console.log(`Seeded ${docs.length} cases`);

  const rain = await Rain.findOne({ type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] });
  if (!rain) {
    await Rain.create({
      amount: 2139000,
      participants: [],
      type: 'site',
      state: 'created'
    });
    console.log('Created site rain');
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
