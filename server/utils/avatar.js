const crypto = require('crypto');

const ARCTIC_AVATARS = ['red', 'green', 'blue', 'orange', 'yellow', 'pink', 'purple'];

function pickRandomAvatar() {
    return ARCTIC_AVATARS[crypto.randomInt(0, ARCTIC_AVATARS.length)];
}

module.exports = {
    ARCTIC_AVATARS,
    pickRandomAvatar
};
