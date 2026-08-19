const FAQS = [
  {
    q: "What is BloxyWild?",
    a: "BloxyWild is an independent case-opening and original games site. It is not affiliated with Roblox Corporation.",
  },
  {
    q: "How do deposits work?",
    a: "You can deposit with crypto or gift cards from the Deposit button in the header once you are logged in.",
  },
  {
    q: "Are games provably fair?",
    a: "Yes. Each game uses hashed server seeds and a client seed so results can be verified after the round.",
  },
  {
    q: "How do I get support?",
    a: "Use the Support item in the sidebar, or join the Discord from the footer.",
  },
];

export default function FaqPage() {
  return (
    <article className="mx-auto grid w-full max-w-[720px] gap-16">
      <h1 className="text-24 font-semibold text-white">FAQ</h1>
      {FAQS.map((item) => (
        <div key={item.q} className="grid gap-6 rounded-12 bg-grey-39 p-16">
          <h2 className="text-16 text-white">{item.q}</h2>
          <p className="text-14 leading-7 text-grey-190">{item.a}</p>
        </div>
      ))}
    </article>
  );
}
