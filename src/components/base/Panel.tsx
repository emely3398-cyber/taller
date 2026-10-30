import type { ReactNode } from "react";

type PanelProps = {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
};

export default function Panel({
  title,
  hint,
  actions,
  children,
  className = "",
  bodyClassName = "",
  flush = false,
}: PanelProps) {
  return (
    <section className={`border border-background-800 bg-background-900 ${className}`.trim()}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-background-800 px-3 py-2 md:px-4">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-semibold text-foreground-100">{title}</h2>}
            {hint && <p className="mt-0.5 text-[11px] text-foreground-500">{hint}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${flush ? "" : "p-3 md:p-4"} ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}