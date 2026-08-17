export function ComingSoon({
  title,
  img,
  note = "This mode is coming soon.",
}: {
  title: string;
  img?: string;
  note?: string;
}) {
  return (
    <div className="grid w-full place-items-center gap-16 py-40">
      {img ? <img alt="" className="h-180 w-180 object-contain opacity-80" src={img} /> : null}
      <h1 className="text-24 text-white">{title}</h1>
      <p className="text-14 text-grey-142">{note}</p>
    </div>
  );
}
