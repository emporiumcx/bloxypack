const Box = require('../database/models/Box');
const cases = require('../data/cases-data.json');
const drops = require('../data/drops-data.json');

function itemsForSlug(slug) {
    return (drops[slug] || []).map((d) => {
        const item = {
            name: d.name,
            image: `/cdn/items/${d.id}.webp`,
            amountFixed: Math.round(Number(d.value) * 1000),
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
}

function boxDoc(c) {
    return {
        name: c.name,
        slug: c.slug,
        amount: Math.round(Number(c.price) * 1000),
        levelMin: 0,
        items: itemsForSlug(c.slug),
        categories: [c.risk],
        type: 'case',
        state: 'active'
    };
}

let catalogSynced = false;

const syncCaseBoxes = async (force = false) => {
    if (catalogSynced && !force) return;
    const ops = cases
        .map((c) => boxDoc(c))
        .filter((d) => d.items.length > 0)
        .map((doc) => ({
            updateOne: {
                filter: { slug: doc.slug },
                update: { $set: doc },
                upsert: true
            }
        }));
    if (ops.length) await Box.bulkWrite(ops);
    catalogSynced = true;
};

const findActiveBox = async (data) => {
    const query = data?.slug ? { slug: data.slug } : { _id: data.boxId };
    let box = await Box.findOne(query).select('name slug amount items categories type state').lean();
    if ((!box || box.state !== 'active') && data?.slug) {
        await syncCaseBoxes(true);
        box = await Box.findOne({ slug: data.slug }).select('name slug amount items categories type state').lean();
    }
    return box;
};

module.exports = {
    syncCaseBoxes,
    findActiveBox
};
