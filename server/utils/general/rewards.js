const fs = require('fs');
const path = require('path');

const dropsData = require((() => {
    const candidates = [
        path.join(__dirname, '../../data/drops-data.json'),
        path.join(__dirname, '../../../src/lib/drops-data.json')
    ];
    const found = candidates.find((file) => fs.existsSync(file));
    if (!found) {
        throw new Error('drops-data.json is missing from the API deploy.');
    }
    return found;
})());

const BONUS_CASES = [
    { kind: 'bonus', tier: 1, xp: 10000, slug: 'bonus-1' },
    { kind: 'bonus', tier: 2, xp: 25000, slug: 'bonus-2' },
    { kind: 'bonus', tier: 3, xp: 50000, slug: 'bonus-3' },
    { kind: 'bonus', tier: 4, xp: 100000, slug: 'bonus-4' },
    { kind: 'bonus', tier: 5, xp: 250000, slug: 'bonus-5' },
    { kind: 'bonus', tier: 6, xp: 500000, slug: 'bonus-6' },
    { kind: 'bonus', tier: 7, xp: 750000, slug: 'bonus-7' },
    { kind: 'bonus', tier: 8, xp: 1000000, slug: 'bonus-8' },
    { kind: 'bonus', tier: 9, xp: 1250000, slug: 'bonus-9' },
    { kind: 'bonus', tier: 10, xp: 1500000, slug: 'bonus-10' },
    { kind: 'bonus', tier: 15, xp: 3000000, slug: 'bonus-15' },
    { kind: 'bonus', tier: 20, xp: 5000000, slug: 'bonus-20' }
];

const DAILY_CASES = [
    { kind: 'daily', level: 10, slug: 'daily-1' },
    { kind: 'daily', level: 20, slug: 'daily-2' },
    { kind: 'daily', level: 30, slug: 'daily-3' },
    { kind: 'daily', level: 40, slug: 'daily-4' },
    { kind: 'daily', level: 50, slug: 'daily-5' },
    { kind: 'daily', level: 60, slug: 'daily-6' },
    { kind: 'daily', level: 70, slug: 'daily-7' },
    { kind: 'daily', level: 80, slug: 'daily-8' },
    { kind: 'daily', level: 90, slug: 'daily-9' },
    { kind: 'daily', level: 100, slug: 'daily-10' }
];

const RANK_CASES = [
    { kind: 'rank', slug: 'bronze-case', level: 13 },
    { kind: 'rank', slug: 'silver-case', level: 25 },
    { kind: 'rank', slug: 'gold-case', level: 45 },
    { kind: 'rank', slug: 'platinum-case', level: 65 },
    { kind: 'rank', slug: 'diamond-case', level: 85 }
];

const utcDate = () => new Date().toISOString().slice(0, 10);

const displayXp = (milli) => Math.floor((Number(milli) || 0) / 1000);

const pickDrop = (slug) => {
    const drops = dropsData[slug];
    if (!drops || !drops.length) throw new Error('This reward case has no items.');
    const ticket = Math.floor(Math.random() * 100000);
    return drops.find((d) => ticket >= d.minTicket && ticket <= d.maxTicket) || drops[drops.length - 1];
};

const findCase = (slug) =>
    BONUS_CASES.find((c) => c.slug === slug) ||
    DAILY_CASES.find((c) => c.slug === slug) ||
    RANK_CASES.find((c) => c.slug === slug);

const normalizeRewards = (user, level) => {
    const rewards = user.rewards || {};
    const today = utcDate();
    let dailyOpened = Array.isArray(rewards.dailyOpened) ? [...rewards.dailyOpened] : [];
    let dailyDate = rewards.dailyDate || '';
    if (dailyDate !== today) {
        dailyDate = today;
        dailyOpened = [];
    }
    const rankKeys = { ...(rewards.rankKeys || {}) };
    const rankGranted = Array.isArray(rewards.rankGranted) ? [...rewards.rankGranted] : [];
    for (const c of RANK_CASES) {
        if (level >= c.level && !rankGranted.includes(c.slug)) {
            rankKeys[c.slug] = Math.max(0, Number(rankKeys[c.slug] || 0)) + 1;
            rankGranted.push(c.slug);
        }
    }
    return {
        bonusXp: Number(rewards.bonusXp || 0),
        dailyDate,
        dailyOpened,
        rankKeys,
        rankGranted
    };
};

module.exports = {
    BONUS_CASES,
    DAILY_CASES,
    RANK_CASES,
    utcDate,
    displayXp,
    pickDrop,
    findCase,
    normalizeRewards
};
