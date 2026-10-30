export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap border px-2.5 py-1.5 text-[12px] font-medium transition-colors rounded-[2px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary-600 bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
  secondary:
    "border-background-800 bg-background-900 text-foreground-200 hover:bg-background-200 hover:text-foreground-50",
  ghost: "border-transparent bg-transparent text-foreground-400 hover:bg-background-200 hover:text-foreground-100",
  danger: "border-accent-700 bg-accent-600 text-white hover:bg-accent-700",
};

export function btn(variant: ButtonVariant = "secondary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}