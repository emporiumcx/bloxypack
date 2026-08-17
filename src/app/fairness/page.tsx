export default function FairnessPage() {
  return (
    <article className="mx-auto max-w-[720px] space-y-12 text-14 leading-7 text-grey-190">
      <h1 className="text-24 font-semibold text-white">Provably Fair</h1>
      <p>
        RoStake games use hashed server seeds and client seeds so each result can be verified after the round. You can
        rotate your client seed from the fairness tools in-game where available.
      </p>
      <p>
        Case openings roll a ticket from 0 to 99,999 against the published ranges on each case. The ticket that lands
        in an item&apos;s min–max range is the item you receive.
      </p>
    </article>
  );
}
