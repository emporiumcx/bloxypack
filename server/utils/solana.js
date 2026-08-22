const crypto = require('crypto');
const fetch = require('node-fetch');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const MIN_SOL_LAMPORTS = 10_000_000;
const MIN_USDC_ATOMS = 1_000_000;
const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const solanaEnabled = () => Boolean(process.env.SOLANA_HOT_SECRET);

const rpc = async (method, params) => {
    const response = await fetch(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Solana RPC error');
    return data.result;
}

const masterSecret = () => {
    const raw = Buffer.from(process.env.SOLANA_HOT_SECRET, 'base64');
    if (raw.length === 64) return raw;
    if (raw.length === 32) return Buffer.from(nacl.sign.keyPair.fromSeed(raw).secretKey);
    throw new Error('SOLANA_HOT_SECRET is invalid.');
}

const keypairFromSecret = (secret) => {
    const seed = secret.subarray(0, 32);
    const pair = nacl.sign.keyPair.fromSeed(seed);
    return {
        publicKey: bs58.encode(Buffer.from(pair.publicKey)),
        secretKey: Buffer.from(pair.secretKey)
    };
}

const treasuryKeypair = () => keypairFromSecret(masterSecret());

const depositKeypair = (userId) => {
    const seed = crypto.createHmac('sha256', masterSecret().subarray(0, 32)).update(String(userId)).digest();
    return keypairFromSecret(seed);
}

const treasuryPublicKey = () => treasuryKeypair().publicKey;

const isSolanaAddress = (value) => {
    try {
        const bytes = bs58.decode(String(value));
        return bytes.length === 32;
    } catch (err) {
        return false;
    }
}

const fetchUsdPrices = async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    const solUsd = Number(data?.solana?.usd);
    if (!Number.isFinite(solUsd) || solUsd <= 0) throw new Error('Could not load SOL price.');
    return { solUsd, usdcUsd: 1 };
}

const siteCoinsFromUsd = (usd) => Math.floor(usd * 1000);

const getSolBalance = async (address) => {
    const result = await rpc('getBalance', [address, { commitment: 'confirmed' }]);
    return Number(result.value || 0);
}

const getUsdcAtoms = async (address) => {
    const result = await rpc('getTokenAccountsByOwner', [
        address,
        { mint: USDC_MINT },
        { encoding: 'jsonParsed', commitment: 'confirmed' }
    ]);
    const accounts = result.value || [];
    let total = 0;
    for (const row of accounts) {
        total += Number(row.account?.data?.parsed?.info?.tokenAmount?.amount || 0);
    }
    return total;
}

const loadWeb3 = async () => import('@solana/web3.js');
const loadSpl = async () => import('@solana/spl-token');

const sendFrom = async (fromSecret, toAddress, lamports) => {
    const web3 = await loadWeb3();
    const from = web3.Keypair.fromSecretKey(fromSecret);
    const conn = new web3.Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    const tx = new web3.Transaction().add(web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: new web3.PublicKey(toAddress),
        lamports
    }));
    return web3.sendAndConfirmTransaction(conn, tx, [from]);
}

const sendSol = async (toAddress, lamports) => {
    if (lamports < MIN_SOL_LAMPORTS) throw new Error('SOL amount is below the network minimum.');
    return sendFrom(treasuryKeypair().secretKey, toAddress, lamports);
}

const sendUsdcFrom = async (fromSecret, toAddress, atoms) => {
    const web3 = await loadWeb3();
    const spl = await loadSpl();
    const from = web3.Keypair.fromSecretKey(fromSecret);
    const dest = new web3.PublicKey(toAddress);
    const mint = new web3.PublicKey(USDC_MINT);
    const conn = new web3.Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    const fromAta = await spl.getAssociatedTokenAddress(mint, from.publicKey);
    const toAta = await spl.getAssociatedTokenAddress(mint, dest);
    const ix = [];
    try {
        await spl.getAccount(conn, toAta, 'confirmed');
    } catch (err) {
        ix.push(spl.createAssociatedTokenAccountInstruction(from.publicKey, toAta, dest, mint));
    }
    ix.push(spl.createTransferInstruction(fromAta, toAta, from.publicKey, BigInt(atoms), [], spl.TOKEN_PROGRAM_ID));
    const tx = new web3.Transaction().add(...ix);
    return web3.sendAndConfirmTransaction(conn, tx, [from]);
}

const sendUsdc = async (toAddress, atoms) => {
    if (atoms < MIN_USDC_ATOMS) throw new Error('USDC amount is below the minimum.');
    return sendUsdcFrom(treasuryKeypair().secretKey, toAddress, atoms);
}

const sweepDestination = () => process.env.SOLANA_OWNER_ADDRESS || treasuryPublicKey();

const sweepDepositToHotWallet = async (userId) => {
    const dest = sweepDestination();
    if (!isSolanaAddress(dest)) return;
    const deposit = depositKeypair(userId);
    if (deposit.publicKey === dest) return;
    const usdc = await getUsdcAtoms(deposit.publicKey);
    const sol = await getSolBalance(deposit.publicKey);
    const feeReserve = 3_000_000;
    if (usdc >= MIN_USDC_ATOMS) {
        if (sol < feeReserve) {
            await sendFrom(treasuryKeypair().secretKey, deposit.publicKey, feeReserve);
        }
        await sendUsdcFrom(deposit.secretKey, dest, usdc);
    }
    const solLeft = await getSolBalance(deposit.publicKey);
    const sendable = solLeft - feeReserve;
    if (sendable >= MIN_SOL_LAMPORTS) {
        await sendFrom(deposit.secretKey, dest, sendable);
    }
}

module.exports = {
    USDC_MINT,
    MIN_SOL_LAMPORTS,
    MIN_USDC_ATOMS,
    LAMPORTS_PER_SOL,
    TOKEN_PROGRAM,
    solanaEnabled,
    treasuryPublicKey,
    depositKeypair,
    isSolanaAddress,
    fetchUsdPrices,
    siteCoinsFromUsd,
    getSolBalance,
    getUsdcAtoms,
    sendSol,
    sendUsdc,
    sweepDepositToHotWallet
}
