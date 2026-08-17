import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid w-full place-items-center gap-12 py-40">
      <h1 className="text-24 text-white">This page could not be found.</h1>
      <Link href="/" className="text-14 text-green">
        Back home
      </Link>
    </div>
  );
}
