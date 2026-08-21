import type { ReactNode } from "react";

export function SocialIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="btn-glass inline-flex h-32 w-32 items-center justify-center text-14"
    >
      {children}
    </a>
  );
}
