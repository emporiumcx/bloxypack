import type { ButtonHTMLAttributes, ReactNode } from "react";

export function FlipTile({
  open,
  backClassName,
  front,
  back,
  className = "",
  ...props
}: {
  open: boolean;
  backClassName: string;
  front: ReactNode;
  back: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`game-flip ${className}`} {...props}>
      <div className={`game-flip-inner ${open ? "is-open" : ""}`}>
        <div className="game-flip-face bg-grey-39">{front}</div>
        <div className={`game-flip-face game-flip-back ${backClassName}`}>{back}</div>
      </div>
    </button>
  );
}
