import type { ReactNode } from "react";

export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function AppButton({
  children,
  onClick,
  kind = "gold",
  type = "button",
  disabled = false,
  small = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "gold" | "outline" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${kind}${small ? " btn-sm" : ""}`}>
      {children}
    </button>
  );
}
