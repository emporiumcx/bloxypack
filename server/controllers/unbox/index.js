const { generateFloats } = require('../../utils/fair');

// Load database models
const User = require('../../database/models/User');
const UserSeed = require('../../database/models/UserSeed');
const Box = require('../../database/models/Box');
const UnboxGame = require('../../database/models/UnboxGame');
const Leaderboard = require('../../database/models/Leaderboard');
const Rain = require('../../database/models/Rain');

// Load utils
const {
    socketRemoveAntiSpam
} = require('../../utils/socket');
const {
    settingGet
} = require('../../utils/setting');
const {
    unboxCheckGetBoxDataData,
    unboxCheckGetBoxDataBox,
    unboxCheckSendBetData,
    unboxCheckSendBetBox,
    unboxCheckSendBetUser,
    unboxCheckSendBetSeed,
    unboxGetOutcomeItem
} = require('../../utils/unbox');
const {
    generalUserGetRakeback,
    generalUserGetFormated
} = require('../../utils/general/user');
const {
    wagerLimitFields
} = require('../../utils/wager');
const {
    findActiveBox,
    syncCaseBoxes
} = require('../../utils/boxes');

// Load controllers
const {
    generalAddBetsList
} = require('../general/bets');

const unboxGetData = () => {
    return new Promise(async(resolve, reject) => {
        try {
            // Get active boxes from database
            await syncCaseBoxes();
            const boxesDatabase = await Box.find({ state: 'active' }).select('name slug amount categories type state').lean();

            resolve({ boxes: boxesDatabase });
        } catch(err) {
            reject(err);
        }
    });
}

const unboxGetBoxDataSocket = async(io, socket, user, data, callback) => {
    try {
        // Validate sent data
        unboxCheckGetBoxDataData(data);

        // Get box from database
        const boxDatabase = await findActiveBox(data);

        // Validate box
        unboxCheckGetBoxDataBox(boxDatabase);

        callback({ success: true, box: boxDatabase });
    } catch(err) {
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}


const unboxSendBetSocket = async(io, socket, user, data, callback) => {
    try {
        // Validate sent data
        unboxCheckSendBetData(data);

        // Validate box
        const boxDatabase = await findActiveBox(data);
        unboxCheckSendBetBox(boxDatabase);

        // Get unbox count
        const unboxCount = Math.floor(data.unboxCount);

        // Get total bet amount
        const amountBetTotal = Math.floor(boxDatabase.amount * unboxCount);

        // Validate user
        unboxCheckSendBetUser(user, amountBetTotal);

        // Get user seed from database and check if available
        const seedDatabase = await UserSeed.findOne({ user: user._id, state: 'active' }).select('seedClient seedServer nonce user state');
        unboxCheckSendBetSeed(seedDatabase);

        // Get running leaderboard from database if available
        const leaderboardDatabase = await Leaderboard.findOne({ state: 'running' }).select('state').lean();

        // Get rain bet amount if user is not sponsored
        const amountBetRain = user.limits.blockSponsor !== true ? amountBetTotal : 0;

        // Get settings
        const settings = settingGet();

        // Get user rakeback rank
        const rakeback = generalUserGetRakeback(user);

        // Get user rakeback amount
        const amountRakeback = user.limits.blockSponsor !== true ? Math.floor(amountBetTotal * rakeback.percentage * settings.general.reward.multiplier) : 0;

        // Get user affiliate amount
        const amountAffiliate = user.affiliates.referrer !== undefined && user.limits.blockSponsor !== true ? Math.floor(amountBetTotal * 0.005) : 0;

        // Create database query promises array
        let promises = [];

        // Create payout amount variable
        let amountPayout = 0;
        const pulled = [];

        for (let i = 0; i < unboxCount; i++) {
            const [float] = generateFloats({
                serverSeed: seedDatabase.seedServer,
                clientSeed: seedDatabase.seedClient,
                nonce: seedDatabase.nonce + i,
                count: 1
            });
            const outcome = Math.floor(float * 100000);
            const outcomeItem = unboxGetOutcomeItem(boxDatabase, outcome);
            if (!outcomeItem || outcomeItem.amountFixed === undefined) {
                throw new Error('Could not resolve case item for this ticket.');
            }
            amountPayout = amountPayout + outcomeItem.amountFixed;
            pulled.push({ ticket: outcome, item: outcomeItem });

            // Add create unbox game query to promises array
            promises.push(
                UnboxGame.create({
                    amount: boxDatabase.amount,
                    payout: outcomeItem.amountFixed,
                    multiplier: Math.floor((outcomeItem.amountFixed / boxDatabase.amount) * 100),
                    outcome: outcome,
                    box: boxDatabase._id,
                    fair: {
                        seed: seedDatabase._id,
                        nonce: (seedDatabase.nonce + i)
                    },
                    user: user._id,
                    state: 'completed'
                })
            );
        }

        // Add update users data, user seed and rain queries to promises array
        promises = [
            User.findByIdAndUpdate(user._id, {
                $inc: {
                    balance: Math.floor(amountPayout - amountBetTotal),
                    xp: user.limits.blockSponsor !== true ? Math.floor(amountBetTotal * settings.general.reward.multiplier) : 0,
                    'rewards.bonusXp': user.limits.blockSponsor !== true ? Math.floor(amountBetTotal * settings.general.reward.multiplier) : 0,
                    'stats.bet': amountBetTotal,
                    'stats.won': amountPayout,
                    ...wagerLimitFields(user.limits, amountBetTotal),
                    'leaderboard.points': leaderboardDatabase !== null && user.limits.blockSponsor !== true && user.limits.blockLeaderboard !== true ? amountBetTotal : 0,
                    'affiliates.generated': amountAffiliate,
                    'rakeback.earned': amountRakeback,
                    'rakeback.available': amountRakeback
                },
                updatedAt: new Date().getTime()
            }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean(),
            UserSeed.findByIdAndUpdate(seedDatabase._id, {
                $inc: {
                    nonce: unboxCount
                },
            }, {}),
            Rain.findOneAndUpdate({ type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] }, {
                $inc: {
                    amount: Math.floor(amountBetRain * 0.001)
                }
            }, { new: true }).select('amount participants type state updatedAt').lean(),
            ...promises
        ];

        // Add update users referrer query to promises array
        if(user.affiliates.referrer !== undefined && amountAffiliate > 0) {
            promises.push(
                User.findByIdAndUpdate(user.affiliates.referrer, {
                    $inc: { 
                        'affiliates.earned': amountAffiliate,
                        'affiliates.available': amountAffiliate
                    },
                    updatedAt: new Date().getTime()
                }, {})
            );
        }

        // Execute promise queries in database
        let dataDatabase = await Promise.all(promises);

        // Get created game objects
        let gamesDatabase = dataDatabase.slice(3, 3 + unboxCount);

        // Convert game objects to javascript objects
        gamesDatabase = gamesDatabase.map((game) => game.toObject());

        // Send updated rain to frontend
        io.of('/general').emit('rain', { rain: dataDatabase[2] });

        callback({
            success: true,
            user: dataDatabase[0],
            games: gamesDatabase.map((game, index) => ({ ...game, ticket: pulled[index].ticket, item: pulled[index].item }))
        });

        setTimeout(async() => {
            // Send updated user to frontend
            io.of('/general').to(user._id.toString()).emit('user', { user: dataDatabase[0] });

            // Add updated bets to bet list
            for(const bet of gamesDatabase) { generalAddBetsList(io, { ...bet, user: generalUserGetFormated(user), method: 'unbox' }); }
        }, 1000 * 5);

        socketRemoveAntiSpam(user._id);
    } catch(err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

module.exports = {
    unboxGetData,
    unboxGetBoxDataSocket,
    unboxSendBetSocket
}