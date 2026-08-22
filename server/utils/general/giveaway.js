const CryptoTransaction = require('../../database/models/CryptoTransaction');
const SteamTransaction = require('../../database/models/SteamTransaction');
const CreditTransaction = require('../../database/models/CreditTransaction');
const GiftTransaction = require('../../database/models/GiftTransaction');
const RobuxTransaction = require('../../database/models/RobuxTransaction');
const LimitedTransaction = require('../../database/models/LimitedTransaction');
const GiveawayDraw = require('../../database/models/GiveawayDraw');
const GiveawayWin = require('../../database/models/GiveawayWin');

const KINDS = ['daily', 'weekly', 'monthly'];
const CLAIM_MS = 7 * 24 * 60 * 60 * 1000;
const settling = new Set();

const DEPOSIT_REQ = {
    daily: 1 * 1000,
    weekly: 10 * 1000,
    monthly: 25 * 1000
};

const PRIZES = {
    daily: { slug: 'daily-1', name: 'Daily Case I', image: '/cdn/packs/daily-1.webp' },
    weekly: { slug: 'prestige', name: 'High Society', image: '/cdn/packs/prestige.webp' },
    monthly: { slug: 'oil-baron', name: 'Black Gold', image: '/cdn/packs/oil-baron.webp' }
};

const periodStart = (kind, from = new Date()) => {
    const d = from instanceof Date ? from : new Date(from);
    if (kind === 'daily') {
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    if (kind === 'weekly') {
        const day = d.getUTCDay();
        const daysToAdd = (8 - day) % 7 || 7;
        const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToAdd);
        return new Date(end - 7 * 24 * 60 * 60 * 1000);
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
};

const previousPeriodStart = (kind) => {
    const current = periodStart(kind);
    if (kind === 'daily') return new Date(current.getTime() - 86400000);
    if (kind === 'weekly') return new Date(current.getTime() - 7 * 86400000);
    return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1));
};

const periodKey = (kind, start) => {
    const d = start instanceof Date ? start : new Date(start);
    if (kind === 'monthly') {
        return `monthly:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    return `${kind}:${d.toISOString().slice(0, 10)}`;
};

const asUserId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return String(value._id);
    return String(value);
};

const loadDepositsSince = async (start, end) => {
    const createdAt = end ? { $gte: start, $lt: end } : { $gte: start };
    const userDeposit = { type: 'deposit', state: 'completed', createdAt };
    const [crypto, steam, credit, gift, robux, limited] = await Promise.all([
        CryptoTransaction.find(userDeposit).select('amount user createdAt').lean(),
        SteamTransaction.find(userDeposit).select('amount user createdAt').lean(),
        CreditTransaction.find(userDeposit).select('amount user createdAt').lean(),
        GiftTransaction.find(userDeposit).select('amount user createdAt').lean(),
        RobuxTransaction.find({
            state: 'completed',
            createdAt,
            'deposit.user': { $exists: true, $ne: null }
        }).select('amount deposit.user createdAt').lean(),
        LimitedTransaction.find({
            state: 'completed',
            createdAt,
            'deposit.user': { $exists: true, $ne: null }
        }).select('amount deposit.user createdAt').lean()
    ]);

    const rows = [];
    for (const tx of crypto) rows.push({ user: tx.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    for (const tx of steam) rows.push({ user: tx.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    for (const tx of credit) rows.push({ user: tx.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    for (const tx of gift) rows.push({ user: tx.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    for (const tx of robux) rows.push({ user: tx.deposit && tx.deposit.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    for (const tx of limited) rows.push({ user: tx.deposit && tx.deposit.user, amount: tx.amount || 0, createdAt: tx.createdAt });
    return rows;
};

const totalsForRows = (rows, startMs, endMs) => {
    const totals = new Map();
    for (const row of rows) {
        const id = asUserId(row.user);
        if (!id) continue;
        const at = new Date(row.createdAt).getTime();
        if (at < startMs) continue;
        if (endMs && at >= endMs) continue;
        totals.set(id, (totals.get(id) || 0) + Number(row.amount || 0));
    }
    return totals;
};

const pickWinner = (totals, req) => {
    const pool = [];
    let tickets = 0;
    for (const [id, amount] of totals.entries()) {
        if (amount < req) continue;
        const weight = Math.max(1, Math.floor(amount / 1000));
        pool.push({ id, weight });
        tickets += weight;
    }
    if (!pool.length || tickets <= 0) return null;
    let cursor = Math.random() * tickets;
    for (const entry of pool) {
        cursor -= entry.weight;
        if (cursor <= 0) return entry.id;
    }
    return pool[pool.length - 1].id;
};

const settleKind = async (kind) => {
    const start = previousPeriodStart(kind);
    const end = periodStart(kind);
    const key = periodKey(kind, start);
    const lock = `${kind}:${key}`;
    if (settling.has(lock)) return;
    settling.add(lock);
    try {
        const existing = await GiveawayDraw.findOne({ kind, periodKey: key }).select('_id').lean();
        if (existing) return;

        const prize = PRIZES[kind];
        const rows = await loadDepositsSince(start, end);
        const winnerId = pickWinner(totalsForRows(rows, start.getTime(), end.getTime()), DEPOSIT_REQ[kind]);

        await GiveawayDraw.create({
            kind,
            periodKey: key,
            slug: prize.slug,
            user: winnerId || undefined,
            skipped: !winnerId
        });

        if (!winnerId) return;

        await GiveawayWin.create({
            user: winnerId,
            kind,
            periodKey: key,
            slug: prize.slug,
            state: 'claimable',
            expiresAt: new Date(Date.now() + CLAIM_MS)
        });
    } catch (err) {
        if (err && err.code !== 11000) console.error(err);
    } finally {
        settling.delete(lock);
    }
};

const generalSettleGiveaways = async () => {
    await Promise.all(KINDS.map((kind) => settleKind(kind)));
};

const generalGetGiveawayClaims = async (userId) => {
    if (!userId) return [];
    const now = new Date();
    await GiveawayWin.updateMany(
        { user: userId, state: 'claimable', expiresAt: { $lte: now } },
        { $set: { state: 'expired' } }
    );
    const wins = await GiveawayWin.find({
        user: userId,
        state: 'claimable',
        expiresAt: { $gt: now }
    }).sort({ expiresAt: 1 }).lean();

    return wins.map((win) => {
        const prize = PRIZES[win.kind] || { slug: win.slug, name: win.slug, image: `/cdn/packs/${win.slug}.webp` };
        return {
            id: String(win._id),
            kind: win.kind,
            slug: win.slug,
            name: prize.name,
            image: prize.image,
            expiresAt: new Date(win.expiresAt).getTime()
        };
    });
};

const generalGetGiveawayStats = async (userId) => {
    await generalSettleGiveaways();
    const starts = {
        daily: periodStart('daily'),
        weekly: periodStart('weekly'),
        monthly: periodStart('monthly')
    };
    const rows = await loadDepositsSince(starts.monthly);
    const viewer = asUserId(userId);
    const giveaways = {};

    for (const kind of KINDS) {
        const startMs = starts[kind].getTime();
        const req = DEPOSIT_REQ[kind];
        const totals = totalsForRows(rows, startMs);
        let entries = 0;
        for (const amount of totals.values()) {
            if (amount >= req) entries += 1;
        }
        const deposited = viewer ? (totals.get(viewer) || 0) : 0;
        giveaways[kind] = {
            entries,
            deposited: deposited / 1000,
            tickets: Math.floor(deposited / 1000),
            eligible: deposited >= req
        };
    }

    return giveaways;
};

module.exports = {
    DEPOSIT_REQ,
    PRIZES,
    CLAIM_MS,
    generalGetGiveawayStats,
    generalGetGiveawayClaims,
    generalSettleGiveaways
};
