const wagerLimitInc = (current, amount) => {
    const cur = Number(current);
    const amt = Number(amount);
    const safeCur = Number.isFinite(cur) ? cur : 0;
    const safeAmt = Number.isFinite(amt) ? amt : 0;
    if (safeAmt <= 0) return 0;
    return Math.floor(safeCur - safeAmt) <= 0 ? -safeCur : -safeAmt;
};

const wagerLimitFields = (limits, amount) => ({
    'limits.betToWithdraw': wagerLimitInc(limits && limits.betToWithdraw, amount),
    'limits.betToRain': wagerLimitInc(limits && limits.betToRain, amount)
});

module.exports = {
    wagerLimitInc,
    wagerLimitFields
};
