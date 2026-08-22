// Load database models
const User = require('../../../database/models/User');
const CryptoPrice = require('../../../database/models/CryptoPrice');
const CryptoAddress = require('../../../database/models/CryptoAddress');
const CryptoTransaction = require('../../../database/models/CryptoTransaction');

// Load utils
const {
    socketRemoveAntiSpam
} = require('../../../utils/socket');
const {
    settingGet,
    settingSetValue
} = require('../../../utils/setting');
const {
    cashierCheckSendCryptoWithdrawData,
    cashierCheckSendCryptoWithdrawUser,
    cashierCheckSendCryptoWithdrawTransactions,
    cashierCryptoGetPrices
} = require('../../../utils/cashier/crypto');
const {
    solanaEnabled,
    depositKeypair,
    fetchUsdPrices,
    siteCoinsFromUsd,
    getSolBalance,
    getUsdcAtoms,
    sendSol,
    sendUsdc,
    sweepDepositToHotWallet,
    MIN_SOL_LAMPORTS,
    MIN_USDC_ATOMS,
    LAMPORTS_PER_SOL
} = require('../../../utils/solana');

const cashierGetCryptoDataSocket = async(io, socket, user, data, callback) => {
    try {
        if (solanaEnabled()) {
            const existing = await CryptoAddress.findOne({ user: user._id, name: 'sol' }).select('name address user').lean();
            const address = existing?.address || depositKeypair(user._id).publicKey;
            if (!existing) {
                await CryptoAddress.create({ name: 'sol', address, user: user._id, creditedSol: 0, creditedUsdc: 0 });
            }
            const prices = await CryptoPrice.find({ name: { $in: ['sol', 'usdc'] } }).select('name price fee').lean();
            const formattedPrices = prices.reduce((acc, currency) => {
                acc[currency.name] = { price: currency.price, fee: currency.fee };
                return acc;
            }, {});
            callback({ success: true, addresses: { sol: address, usdc: address }, prices: formattedPrices });
            return;
        }

        //Delete wrong data
        let dataDatabase = await Promise.all([
            CryptoAddress.find({ user: user._id, address: null }).select('name address user').lean()
        ]);

        if (dataDatabase[0].length > 0 ) {
            for (let cryptoAddress of dataDatabase[0]) {
                await CryptoAddress.findByIdAndDelete(cryptoAddress._id);
            }
        }

        // Get users crypto deposit addresses and crypto prices from database
        dataDatabase = await Promise.all([
            CryptoAddress.find({ user: user._id }).select('name address user').lean(),
            CryptoPrice.find({}).select('name price fee').lean()
        ]);

        if(dataDatabase[0].length <= 0) {
            // Generate new crypto addresses with coinpayments api
            const addresses = await Promise.all([
                cashierCryptoGenerateAddress('btc'),
                cashierCryptoGenerateAddress('eth'),
                cashierCryptoGenerateAddress('ltc')
            ]);

            // Save users crypto deposit addresses in database
            await Promise.all([
                CryptoAddress.create({ name: 'btc', address: addresses[0].address, user: user._id }),
                CryptoAddress.create({ name: 'eth', address: addresses[1].address, user: user._id }),
                CryptoAddress.create({ name: 'ltc', address: addresses[2].address, user: user._id })
            ]);

            // Format crypto addresses
            dataDatabase[0] = { btc: addresses[0].address, eth: addresses[1].address, ltc: addresses[2].address };
        } else { 
            // Format crypto addresses
            dataDatabase[0] = dataDatabase[0].reduce((acc, currency) => { acc[currency.name] = currency.address; return acc; }, {});
        }

        // Format crypto prices
        dataDatabase[1] = dataDatabase[1].reduce((acc, currency) => { acc[currency.name] = { price: currency.price, fee: currency.fee }; return acc; }, {});

        callback({ success: true, addresses: dataDatabase[0], prices: dataDatabase[1] });
    } catch(err) {
        console.error(err);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

const cashierSendCryptoWithdrawSocket = async(io, socket, user, data, callback) => {
    try {
        // Validate sent data
        cashierCheckSendCryptoWithdrawData(data);

        // Validate withdraw user
        cashierCheckSendCryptoWithdrawUser(data, user);

        // Get crypto prices and user active crypto transactions from database
        let dataDatabase = await Promise.all([
            CryptoPrice.findOne({ name: data.currency }).select('name price').lean(),
            CryptoTransaction.find({ user: user._id, state: 'pending' }).select('user state').lean()
        ]);

        // Validate withdraw transactions
        cashierCheckSendCryptoWithdrawTransactions(dataDatabase[1]);

        // Get settings
        const settings = settingGet();

        // Get sent amount
        const amount = Math.floor(data.amount);
        const price = dataDatabase[0] && dataDatabase[0].price;
        let amountCurrency;
        if (data.currency === 'sol') {
            amountCurrency = Math.floor(amount / price * LAMPORTS_PER_SOL);
        } else if (data.currency === 'usdc') {
            amountCurrency = Math.floor(amount * 1000);
        } else {
            amountCurrency = Math.floor((amount / 1000) * settings.crypto.withdraw.rate / price * 100000000);
        }

        const updatedUser = await User.findOneAndUpdate({
            _id: user._id,
            balance: { $gte: amount }
        }, {
            $inc: {
                balance: -amount,
                'stats.withdraw': amount
            }
        }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean();

        if (!updatedUser) {
            throw new Error('You don’t have enough balance for this action.');
        }

        let transaction;
        try {
            transaction = await CryptoTransaction.create({
                amount: amount,
                data: {
                    receiver: data.address,
                    currency: data.currency,
                    cryptoAmount: amountCurrency
                },
                type: 'withdraw',
                user: user._id,
                state: 'pending'
            });
        } catch (createErr) {
            await User.findByIdAndUpdate(user._id, {
                $inc: {
                    balance: amount,
                    'stats.withdraw': -amount
                }
            });
            throw createErr;
        }

        if (solanaEnabled() && ['sol', 'usdc'].includes(data.currency)) {
            try {
                const signature = data.currency === 'sol'
                    ? await sendSol(data.address, amountCurrency)
                    : await sendUsdc(data.address, amountCurrency);
                transaction = await CryptoTransaction.findByIdAndUpdate(transaction._id, {
                    'data.transaction': signature,
                    state: 'completed'
                }, { new: true });
            } catch (payoutErr) {
                await Promise.all([
                    CryptoTransaction.findByIdAndUpdate(transaction._id, { state: 'canceled' }),
                    User.findByIdAndUpdate(user._id, {
                        $inc: { balance: amount, 'stats.withdraw': -amount }
                    })
                ]);
                throw new Error(payoutErr.message || 'Solana payout failed. Balance was refunded.');
            }
            const paidUser = await User.findById(user._id).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean();
            io.of('/general').to(user._id.toString()).emit('user', { user: paidUser });
            callback({ success: true, user: paidUser, transaction: transaction.toObject ? transaction.toObject() : transaction });
            socketRemoveAntiSpam(user._id);
            return;
        }

        dataDatabase = [updatedUser, transaction.toObject()];

        callback({ success: true, user: dataDatabase[0], transaction: dataDatabase[1] });

        socketRemoveAntiSpam(user._id);
    } catch(err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

const cashierCryptoCheckPrices = async() => {
    try {
        if (solanaEnabled()) {
            const { solUsd } = await fetchUsdPrices();
            await Promise.all([
                CryptoPrice.findOneAndUpdate({ name: 'sol' }, { price: Math.floor(solUsd * 1000), fee: 0 }, { upsert: true }),
                CryptoPrice.findOneAndUpdate({ name: 'usdc' }, { price: 1000, fee: 0 }, { upsert: true })
            ]);
            setTimeout(() => { cashierCryptoCheckPrices(); }, 1000 * 60 * 15);
            return;
        }

        const dataPrices = await cashierCryptoGetPrices();
        const priceBtc = Math.floor(1 / dataPrices.USD.rate_btc * 1000);
        await Promise.all([
            CryptoPrice.findOneAndUpdate({ name: 'btc' }, { 
                price: priceBtc, 
                fee: Math.floor(dataPrices.BTC.tx_fee / 1 * priceBtc) 
            }, { upsert: true }),
            CryptoPrice.findOneAndUpdate({ name: 'eth' }, { 
                price: Math.floor(priceBtc * dataPrices.ETH.rate_btc), 
                fee: Math.floor(dataPrices.ETH.tx_fee / 1 * priceBtc * dataPrices.ETH.rate_btc) 
            }, { upsert: true }),
            CryptoPrice.findOneAndUpdate({ name: 'ltc' }, { 
                price: Math.floor(priceBtc * dataPrices.LTC.rate_btc), 
                fee: Math.floor(dataPrices.LTC.tx_fee / 1 * priceBtc * dataPrices.LTC.rate_btc) 
            }, { upsert: true })
        ]);

        setTimeout(() => { cashierCryptoCheckPrices(); }, 1000 * 60 * 60 * 6);
    } catch(err) {
        setTimeout(() => { cashierCryptoCheckPrices(); }, 1000 * 60 * 15);
    }
}

const cashierSolanaScanDeposits = async(io) => {
    if (!solanaEnabled()) return;
    try {
        const prices = await CryptoPrice.find({ name: { $in: ['sol', 'usdc'] } }).select('name price').lean();
        const solPrice = prices.find((p) => p.name === 'sol')?.price || 0;
        const rows = await CryptoAddress.find({ name: 'sol', address: { $ne: null } }).select('address user creditedSol creditedUsdc').lean();
        for (const row of rows) {
            const solBal = await getSolBalance(row.address);
            const usdcBal = await getUsdcAtoms(row.address);
            const prevSol = Number(row.creditedSol || 0);
            const prevUsdc = Number(row.creditedUsdc || 0);
            const dSol = solBal - prevSol;
            const dUsdc = usdcBal - prevUsdc;
            const claimed = await CryptoAddress.findOneAndUpdate({
                _id: row._id,
                creditedSol: prevSol,
                creditedUsdc: prevUsdc
            }, { creditedSol: solBal, creditedUsdc: usdcBal }, { new: true });
            if (!claimed) continue;

            let usd = 0;
            if (dSol >= MIN_SOL_LAMPORTS && solPrice > 0) usd += (dSol / LAMPORTS_PER_SOL) * (solPrice / 1000);
            if (dUsdc >= MIN_USDC_ATOMS) usd += dUsdc / 1_000_000;
            const coins = siteCoinsFromUsd(usd);
            if (coins > 0) {
                const updated = await User.findByIdAndUpdate(row.user, {
                    $inc: { balance: coins, 'stats.deposit': coins }
                }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean();
                await CryptoTransaction.create({
                    amount: coins,
                    data: { currency: dUsdc >= MIN_USDC_ATOMS && dSol < MIN_SOL_LAMPORTS ? 'usdc' : 'sol', receiver: row.address },
                    type: 'deposit',
                    user: row.user,
                    state: 'completed'
                });
                if (updated) io.of('/general').to(String(row.user)).emit('user', { user: updated });
            }
            try {
                await sweepDepositToHotWallet(row.user);
            } catch (sweepErr) {
                console.error('sweep failed', String(row.user), sweepErr.message);
            }
        }
    } catch (err) {
        console.error(err);
    }
    setTimeout(() => { cashierSolanaScanDeposits(io); }, 1000 * 20);
}

const cashierCryptoInit = async(io) => {
    try {
        if (solanaEnabled()) {
            await settingSetValue('crypto.deposit.enabled', true);
            await settingSetValue('crypto.withdraw.enabled', true);
            await settingSetValue('crypto.deposit.rate', 1);
            await settingSetValue('crypto.withdraw.rate', 1);
            cashierSolanaScanDeposits(io);
        }
        cashierCryptoCheckPrices();
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    cashierGetCryptoDataSocket,
    cashierSendCryptoWithdrawSocket,
    cashierCryptoInit
}
