import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export default function Field({ label, htmlFor, hint, required, children, className = "" }: FieldProps) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-400"
      >
        {label}
        {required && <span className="ml-0.5 text-foreground-300">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-foreground-500">{hint}</p>}
    </div>
  );
}