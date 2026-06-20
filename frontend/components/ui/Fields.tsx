import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

function FieldWrapper({ label, error, children, htmlFor }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && <p className="font-mono text-xs text-type-bug">{error}</p>}
    </div>
  );
}

const fieldClasses =
  "w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-accent disabled:opacity-50";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({ label, error, id, ...rest }: InputFieldProps) {
  return (
    <FieldWrapper label={label} error={error} htmlFor={id}>
      <input id={id} className={fieldClasses} {...rest} />
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextareaField({ label, error, id, ...rest }: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} htmlFor={id}>
      <textarea id={id} className={`${fieldClasses} min-h-24 resize-y`} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, error, id, options, placeholder, ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} htmlFor={id}>
      <select id={id} className={fieldClasses} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
