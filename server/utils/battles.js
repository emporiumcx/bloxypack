const validator = require('validator');
const crypto = require('crypto');

// Load database models
const BattlesGame = require('../database/models/BattlesGame');
const { battleTicket } = require('./fair');

const battlesCheckGetGameDataData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.gameId === undefined || data.gameId === null || typeof data.gameId !== 'string' || validator.isMongoId(data.gameId) !== true) {
        throw new Error('Your entered game id is invalid.');
    }
}

const battlesCheckGetGameDataGame = (battlesGame) => {
    if(battlesGame === null) {
        throw new Error('Your entered game id is not available.');
    }
}

const battlesCheckSendCreateData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.playerCount === undefined || data.playerCount === null || isNaN(data.playerCount) === true || Math.floor(data.playerCount) < 2 || Math.floor(data.playerCount) > 6) {
        throw new Error('Your entered mode is invalid.');
    } else if(data.mode === undefined || data.mode === null || typeof data.mode !== 'string' || ['standard', 'team', 'group'].includes(data.mode) !== true) {
        throw new Error('Your entered mode is invalid.');
    } else if(data.boxes === undefined || data.boxes === null || Array.isArray(data.boxes) !== true || data.boxes.length <= 0) {
        throw new Error('Your entered boxes are invalid.');
    } else if(data.levelMin === undefined || data.levelMin === null || isNaN(data.levelMin) === true || data.levelMin < 0 || data.levelMin > 100) {
        throw new Error('Your entered min level is invalid.');
    } else if(data.funding === undefined || data.funding === null || isNaN(data.funding) === true || data.funding < 0 || data.funding > 80) {
        throw new Error('Your entered funding value is invalid.');
    } else if(data.private === undefined || data.private === null || typeof data.private !== 'boolean') {
        throw new Error('Your entered private value is invalid.');
    } else if(data.affiliateOnly === undefined || data.affiliateOnly === null || typeof data.affiliateOnly !== 'boolean') {
        throw new Error('Your entered affiliate value is invalid.');
    } else if(data.cursed === undefined || data.cursed === null || typeof data.cursed !== 'boolean') {
        throw new Error('Your entered affiliate value is invalid.');
    } else if(data.terminal === undefined || data.terminal === null || typeof data.terminal !== 'boolean') {
        throw new Error('Your entered affiliate value is invalid.');
    } else if(data.jackpot === undefined || data.jackpot === null || typeof data.jackpot !== 'boolean') {
        throw new Error('Your entered jackpot value is invalid.');
    }
}

const battlesCheckSendCreateBoxes = (data) => {
    let count = 0;

    for(let box of data.boxes) {
        if(box._id === undefined || typeof box._id !== 'string' || validator.isMongoId(box._id) !== true) {
            throw new Error('Your entered box id is invalid.');
        } else if(box.count === undefined || isNaN(box.count) === true || Math.floor(box.count) <= 0) {
            throw new Error('Your entered box count is invalid.');
        }

        count = count + box.count;
    }

    if(count > 50) {
        throw new Error('Your are not allowed to select more then 50 boxes.');
    }
}

const battlesCheckSendCreateUser = (user, data, amount) => {
    if(user.balance < amount) {
        throw new Error('You don’t have enough balance for this action.');
    } else if(user.limits.blockSponsor === true && data.funding > 0) {
        throw new Error('You are not allowed to add funding to your battles.');
    }
}

const battlesCheckSendBotData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.gameId === undefined || data.gameId === null || typeof data.gameId !== 'string' || validator.isMongoId(data.gameId) !== true) {
        throw new Error('You’ve entered an invalid game id.');
    }
}

const battlesCheckSendBotGame = (user, battlesGame, battlesBlockJoin, battlesBlockGame) => {
    if(battlesGame === undefined || battlesGame === null || battlesGame.state !== 'created' || battlesBlockGame.includes(battlesGame._id.toString()) === true || battlesGame.playerCount <= Math.floor(battlesGame.bets.length + battlesBlockJoin.filter((element) => element.toString() === battlesGame._id.toString()).length)) {
        throw new Error('Your requested game is not available or completed.');
    } else if(user._id.toString() !== battlesGame.bets[0].user._id.toString()) {
        throw new Error('You aren`t allowed to call bots for this game.');
    }
}

const battlesCheckSendJoinData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.gameId === undefined || data.gameId === null || typeof data.gameId !== 'string' || validator.isMongoId(data.gameId) !== true) {
        throw new Error('You’ve entered an invalid game id.');
    } else if(data.slot === undefined || data.slot === null || isNaN(data.slot) === true || Math.floor(data.slot) < 1 || Math.floor(data.slot) > 3) {
        throw new Error('You’ve entered an invalid slot.');
    }
}

const battlesCheckSendJoinGame = (data, user, battlesGame, battlesBlockJoin, battlesBlockGame) => {
    if(battlesGame === undefined || battlesGame === null || battlesGame.state !== 'created' || battlesBlockGame.includes(battlesGame._id.toString()) === true || battlesGame.playerCount <= Math.floor(battlesGame.bets.length + battlesBlockJoin.filter((element) => element.toString() === battlesGame._id.toString()).length)) {
        throw new Error('Your requested game is not available or completed.');
    } else if(battlesGame.playerCount <= Math.floor(data.slot)) {
        throw new Error('Your requested slot is not available.');
    } else if(battlesGame.bets.some((element) => element.slot === Math.floor(data.slot)) === true) {
        throw new Error('Your requested slot is already occupied.');
    } else if(battlesGame.bets.some((element) => element.user._id.toString() === user._id.toString()) === true) {
        throw new Error('You aren\'t allowed to join more then one time per battles game.');
    } else if(battlesGame.options.levelMin > Math.floor(Math.pow(user.xp / 1000 / 100, 1 / 3))) {
        throw new Error(`You need to have a minimum level of ${battlesGame.options.levelMin} to join this battles game.`);
    } else if(battlesGame.options.affiliateOnly === true && (user.affiliates.referrer === undefined || user.affiliates.referrer.toString() !== battlesGame.bets[0].user._id.toString())) {
        throw new Error('You need to be an creators affiliate to join this battles game.');
    }
}

const battlesCheckSendJoinUser = (user, battlesGame) => {
    if(user.balance < (battlesGame.amount - Math.floor(battlesGame.amount * battlesGame.options.funding / 100))) {
        throw new Error('You don’t have enough balance for this action.');
    }
}

const battlesCheckSendCancelData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.gameId === undefined || data.gameId === null || typeof data.gameId !== 'string' || validator.isMongoId(data.gameId) !== true) {
        throw new Error('Your entered game id is invalid.');
    }
}

const battlesCheckSendCancelGame = (user, battlesGame, battlesBlockJoin, battlesBlockGame) => {
    if(battlesGame === undefined || battlesGame === null || battlesGame.state !== 'created' || battlesBlockGame.some((element) => element.toString() === battlesGame._id.toString()) === true || battlesGame.playerCount <= Math.floor(battlesGame.bets.length + battlesBlockJoin.filter((element) => element.toString() === battlesGame._id.toString()).length)) {
        throw new Error('Your requested game is not available or completed.');
    } else if(user._id.toString() !== battlesGame.bets[0].user._id.toString()) {
       throw new Error('You aren`t allowed to cancel this game.');
    }
}

const battlesGenerateGame = (data, amount, boxes) => {
    return new Promise(async(resolve, reject) => {
        try {
            // Generate new battles server seed
            const seedServer = crypto.randomBytes(24).toString('hex');

            // Hash new generated battles server seed
            const hash = crypto.createHash('sha256').update(seedServer).digest('hex');

            // Create new battles game in database
            let gameDatabase = await BattlesGame.create({
                amount: amount,
                playerCount: Math.floor(data.playerCount),
                mode: data.mode,
                boxes: boxes,
                options: {
                    levelMin: Math.floor(data.levelMin),
                    funding: Math.min(80, Math.max(0, Math.floor(data.funding))),
                    cursed: data.cursed,
                    terminal: data.terminal,
                    jackpot: data.jackpot === true,
                    private: data.private,
                    affiliateOnly: data.affiliateOnly,
                    teams: battlesTeamTag(data)
                },
                fair: {
                    seedServer: seedServer,
                    hash: hash
                },
                state: 'created'
            });

            // Add boxes names to game object
            gameDatabase = await gameDatabase.populate({ path: 'boxes.box', select: 'name slug amount items', populate: { path: 'items.item', select: 'name image amountFixed' } });

            // Convert game object to javascript object
            gameDatabase = gameDatabase.toObject();

            resolve(gameDatabase);
        } catch(err) {
            reject(err);
        }
    });
}

const battlesFormatBoxes = (data, boxesDatabase) => {
    let formated = [];

    for(let box of data.boxes) {
        const boxDatabase = boxesDatabase.find((element) => element._id.toString() === box._id.toString());

        if(boxDatabase !== undefined) {
            const index = formated.findIndex((element) => element.box._id.toString() === boxDatabase._id.toString());

            if(index !== -1) { formated[index].count = formated[index].count + Math.floor(box.count); } 
            else { formated.push({ box: boxDatabase, count: Math.floor(box.count) }); }
        } else { throw new Error('Your entered boxes are invalid.'); }
    }

    return formated;
}

const battlesGetGameIndex = (battlesGames, gameId) => {
    return battlesGames.findIndex((element) => element._id.toString() === gameId.toString());
}

const battlesGetAmountGame = (boxes) => {
    let amount = 0;

    for(let box of boxes) { amount = amount + Math.floor(box.box.amount * box.count); }

    return amount;
}

const battlesGetAmountWin = (battlesGame) => {
    const rounds = battlesGetRounds(battlesGame.boxes);
    let amount = 0;

    for(const bet of battlesGame.bets) {
        for(const [index, outcome] of bet.outcomes.entries()) { amount = Math.floor(amount + battlesGetOutcomeItem(rounds[index].box.items, outcome).amountFixed); }
    }

    return amount;
}

const battlesGetCountUser = (mode) => {
    let count = 2;

    if(mode === '1v1v1') { count = 3; }
    else if(mode === '1v1v1v1' || mode === '2v2') { count = 4; }

    return count;
}

const battlesGetRounds = (boxes) => {
    let rounds = [];

    for(const box of boxes) {
        for(let i = 0; i < box.count; i++) { rounds.push({ box: box.box }); }
    }

    return rounds;
}

const battlesGetOutcomeItem = ( items, outcome) => {
    let pos = 0;
    let outcomeItem = null;

    for(const item of items) {
        if(item.minTicket !== undefined && item.maxTicket !== undefined && outcome >= item.minTicket && outcome <= item.maxTicket) {
            outcomeItem = item.item && item.item.amountFixed !== undefined ? item.item : {
                name: item.name,
                image: item.image,
                amountFixed: item.amountFixed,
                color: item.color,
                dropId: item.dropId
            };
            break;
        }
    }

    if(outcomeItem === null) {
        for(const item of items) {
            pos = pos + (item.tickets || 0);
            if(outcome <= pos) {
                outcomeItem = item.item && item.item.amountFixed !== undefined ? item.item : item;
                break;
            }
        }
    }

    return outcomeItem;
}

const battlesTeamTag = (data) => {
    const raw = typeof data.teams === 'string' ? data.teams.toLowerCase().replace(/vs/g, 'v') : '';
    const n = Math.floor(data.playerCount);
    if (data.mode !== 'team') return '';
    if (raw === '2v2v2' || raw === '3v3' || raw === '2v2') return raw;
    if (n === 6) return '2v2v2';
    if (n === 4) return '2v2';
    return '';
};

const battlesTeamSizes = (battlesGame) => {
    const n = Math.floor(battlesGame.playerCount);
    if (battlesGame.mode !== 'team') return Array.from({ length: n }, () => 1);
    const tag = String(battlesGame.options?.teams || '').toLowerCase().replace(/vs/g, 'v');
    if (tag === '2v2v2') return [2, 2, 2];
    if (tag === '3v3') return [3, 3];
    if (n === 6) return [2, 2, 2];
    if (n === 4) return [2, 2];
    return [Math.floor(n / 2), Math.ceil(n / 2)];
};

const battlesTeamGroups = (battlesGame) => {
    const sizes = battlesTeamSizes(battlesGame);
    const groups = [];
    let i = 0;
    for (const size of sizes) {
        groups.push(Array.from({ length: size }, (_, k) => i + k));
        i += size;
    }
    return groups;
};

const battlesBetScore = (battlesGame, bet) => {
    if (!bet?.outcomes?.length) return 0;
    if (battlesGame.options.terminal === true) return bet.outcomes[bet.outcomes.length - 1] || 0;
    return bet.outcomes.reduce((total, outcome) => total + outcome, 0);
};

const battlesJackpotRoll = (battlesGame, tickets) => {
    const total = tickets.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return 0;
    const seedPublic = battlesGame.fair?.seedPublic || battlesGame.fair?.hash || '';
    return Math.floor((battleTicket(battlesGame.fair.seedServer, seedPublic, 99, 99) / 100000) * total);
};

const battlesGetWinnerBets = (battlesGame) => {
    const rounds = battlesGetRounds(battlesGame.boxes);
    const bets = battlesGame.bets.map((bet) => ({ ...bet, outcomes: bet.outcomes.map((outcome, index) => battlesGetOutcomeItem(rounds[index].box.items, outcome).amountFixed) }));
    let winners = [];

    if (battlesGame.options.jackpot === true) {
        const invert = battlesGame.options.cursed === true;
        if (battlesGame.mode === 'team') {
            const groups = battlesTeamGroups(battlesGame);
            const scoreAt = (slot) => battlesBetScore(battlesGame, bets.find((b) => b.slot === slot) || { outcomes: [] });
            const scores = groups.map((slots) => slots.reduce((sum, slot) => sum + scoreAt(slot), 0));
            const max = Math.max(0, ...scores);
            const tickets = scores.map((score) => invert ? Math.max(1, max - score + 1) : Math.max(1, score));
            const roll = battlesJackpotRoll(battlesGame, tickets);
            let cursor = 0;
            let winGroup = groups[groups.length - 1] || [];
            for (let i = 0; i < tickets.length; i++) {
                cursor += tickets[i];
                if (roll < cursor) {
                    winGroup = groups[i];
                    break;
                }
            }
            winners = winGroup.map((slot) => battlesGame.bets.find((b) => b.slot === slot)).filter(Boolean);
        } else {
            const scores = bets.map((bet) => battlesBetScore(battlesGame, bet));
            const max = Math.max(0, ...scores);
            const tickets = scores.map((score) => invert ? Math.max(1, max - score + 1) : Math.max(1, score));
            const roll = battlesJackpotRoll(battlesGame, tickets);
            let cursor = 0;
            for (let i = 0; i < tickets.length; i++) {
                cursor += tickets[i];
                if (roll < cursor) {
                    winners = [battlesGame.bets[i]];
                    break;
                }
            }
            if (!winners.length) winners = [battlesGame.bets[bets.length - 1]];
        }
        return winners;
    }

    if(battlesGame.mode === 'group') {
        winners = battlesGame.bets;
    } else if(battlesGame.mode === 'team') {
        const groups = battlesTeamGroups(battlesGame);
        const scoreAt = (slot) => battlesBetScore(battlesGame, bets.find((b) => b.slot === slot) || { outcomes: [] });
        const scores = groups.map((slots) => slots.reduce((sum, slot) => sum + scoreAt(slot), 0));
        const target = battlesGame.options.cursed === true ? Math.min(...scores) : Math.max(...scores);
        const tied = scores.filter((score) => score === target).length > 1;
        if (tied) winners = battlesGame.bets;
        else {
            const gi = scores.findIndex((score) => score === target);
            winners = (groups[gi] || []).map((slot) => battlesGame.bets.find((b) => b.slot === slot)).filter(Boolean);
        }
    } else {
        const amounts = bets.map((bet) => battlesBetScore(battlesGame, bet));
        const amountWin = battlesGame.options.cursed === false ? Math.max(...amounts) : Math.min(...amounts);

        for(const [index, bet] of bets.entries()) {
            if(amountWin === battlesBetScore(battlesGame, bet)) { winners.push(battlesGame.bets[index]); }
        }
    }

    return winners;
}

const battlesSanitizeBetUser = (bet) => {
    if (bet.bot === true || !bet.user) return {};
    const rakeback = bet.user.rakeback;
    return {
        _id: bet.user._id,
        roblox: bet.user.roblox,
        username: bet.user.username,
        avatar: bet.user.avatar,
        rank: bet.user.rank,
        level: bet.user.level,
        rakeback: rakeback && typeof rakeback === 'object' ? rakeback.name : rakeback,
        stats: bet.user.stats,
        createdAt: bet.user.createdAt
    };
};

const battlesSanitizeGames = (games) => {
    let sanitized = [];

    for(let game of games) {
        if(game.options.private === false) {
            game = JSON.parse(JSON.stringify(game));

            // Sanitize game fair property
            if(game.state !== 'completed') { game.fair = { hash: game.fair?.hash }; }

            // Sanitize game boxes
            for(let box of game.boxes || []) { if (box.box) box.box.items = []; }
            
            // Sanitize game bets user property
            for(let bet of game.bets || []) { 
                bet.user = battlesSanitizeBetUser(bet);
            }

            // Add sanitized game to sanitized list
            sanitized.push(game);
        }
    }

    return sanitized;
}

const battlesSanitizeGame = (game, all) => {
    let sanitized = JSON.parse(JSON.stringify(game));

    // Sanitize game fair property
    if(sanitized.state !== 'completed') { sanitized.fair = { hash: sanitized.fair?.hash }; }

    // Sanitize game boxes if all not true
    if(all !== true) { for(let box of sanitized.boxes || []) { if (box.box) box.box.items = []; }  }

    // Sanitize game bets user property
    for(let bet of sanitized.bets || []) {
        bet.user = battlesSanitizeBetUser(bet);
    }

    return sanitized;
}

module.exports = {
    battlesCheckGetGameDataData,
    battlesCheckGetGameDataGame,
    battlesCheckSendCreateData,
    battlesCheckSendCreateBoxes,
    battlesCheckSendCreateUser,
    battlesCheckSendBotData,
    battlesCheckSendBotGame,
    battlesCheckSendJoinData,
    battlesCheckSendJoinGame,
    battlesCheckSendJoinUser,
    battlesCheckSendCancelData,
    battlesCheckSendCancelGame,
    battlesGenerateGame,
    battlesFormatBoxes,
    battlesGetGameIndex,
    battlesGetAmountGame,
    battlesGetAmountWin,
    battlesGetCountUser,
    battlesGetRounds,
    battlesGetOutcomeItem,
    battlesGetWinnerBets,
    battlesSanitizeGames,
    battlesSanitizeGame
}