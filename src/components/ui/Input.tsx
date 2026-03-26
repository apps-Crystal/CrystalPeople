import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "enterprise-input",
          error && "border-danger focus-visible:border-danger focus-visible:shadow-[0_0_0_1px_var(--color-danger)]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-text-secondary">{helper}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ label, error, helper, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "enterprise-input h-auto resize-none py-2",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-text-secondary">{helper}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn("enterprise-input", error && "border-danger", className)}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
