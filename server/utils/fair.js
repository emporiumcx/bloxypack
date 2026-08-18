const crypto = require('crypto');

const fetch = require('node-fetch');

const fairGetData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`https://eos.greymass.com/`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response !== undefined && response.status === 200) {
        const data = await response.json();
        resolve({ success: true, data });
      } else {
        reject();
      }
    } catch (err) {
      reject(err);
    }
  });
};

function hmacBytes(serverSeed, message) {
  return crypto.createHmac('sha256', serverSeed).update(message).digest();
}

function* byteGenerator({ serverSeed, clientSeed, nonce, cursor = 0, type = 'seeded', eosId }) {
  let currentRound = Math.floor(cursor / 32);
  let currentRoundCursor = cursor - currentRound * 32;

  while (true) {
    const mod =
      type === 'eos'
        ? `${eosId}:${nonce}:${currentRound}`
        : `${clientSeed}:${nonce}:${currentRound}`;
    const buffer = hmacBytes(serverSeed, mod);

    while (currentRoundCursor < 32) {
      yield buffer[currentRoundCursor];
      currentRoundCursor += 1;
    }

    currentRoundCursor = 0;
    currentRound += 1;
  }
}

function generateFloats({ serverSeed, clientSeed, nonce = 0, count, type = 'seeded', eosId }) {
  const rng = byteGenerator({ serverSeed, clientSeed, nonce, cursor: 0, type, eosId });
  const result = new Array(count);
  const dividers = [256 ** 1, 256 ** 2, 256 ** 3, 256 ** 4];

  for (let i = 0; i < count; i++) {
    let float = 0;
    for (let j = 0; j < 4; j++) {
      const byte = rng.next().value;
      if (byte !== undefined) float += byte / dividers[j];
    }
    result[i] = float;
  }

  return result;
}

function pickIndices(floats, size) {
  const tiles = Array.from({ length: size }, (_, i) => i);
  const indices = [];
  for (const float of floats) {
    const idx = Math.floor(float * tiles.length);
    indices.push(tiles.splice(idx, 1)[0]);
  }
  return indices;
}

function hashServerSeed(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function battleTicket(serverSeed, eosId, seat, round) {
  const buffer = hmacBytes(serverSeed, `${eosId}:${seat}:${round}`);
  let float = 0;
  const dividers = [256 ** 1, 256 ** 2, 256 ** 3, 256 ** 4];
  for (let j = 0; j < 4; j++) float += buffer[j] / dividers[j];
  return Math.floor(float * 100000);
}

module.exports = {
  fairGetData,
  hmacBytes,
  generateFloats,
  pickIndices,
  hashServerSeed,
  battleTicket
};
