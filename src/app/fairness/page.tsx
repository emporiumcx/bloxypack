export default function FairnessPage() {
  return (
    <article className="mx-auto max-w-[720px] space-y-12 text-14 leading-7 text-grey-190">
      <h1 className="text-24 font-semibold text-white">Provably Fair</h1>
      <p>
        WildPVP uses the same HMAC-SHA256 system as RoStake. Before you play, the server commits to a hidden server
        seed and shows you its SHA-256 hash. Your client seed and a nonce are mixed in so the house cannot change the
        result after you bet.
      </p>
      <p>
        Floats are generated from HMAC(serverSeed, clientSeed:nonce:round) four bytes at a time. Mines and Towers pick
        mine tiles by splicing those floats through the remaining tiles. Dice rolls float × 10,000. Roulette rolls
        floor(float × 15): 0 is green (14x), 1–7 red (2x), 8–14 black (2x). Cases and battles roll float × 100,000 and
        match the ticket against each item&apos;s min–max range.
      </p>
      <p>
        House edge matches RoStake: Mines 1% (0.99 × combinatorial multiplier), Towers 3% (0.97 × row ratio), Dice 10%
        (90 / win chance), Roulette 6.67% (14/15 return on every color).
      </p>
      <p>
        Rotate your client seed from profile fairness after a session to reveal the previous server seed and verify past
        rounds.
      </p>
    </article>
  );
}
