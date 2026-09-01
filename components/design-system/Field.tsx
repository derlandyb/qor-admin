import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface BaseFieldProps {
  label: string;
  error?: string;
}

interface FieldWrapperProps extends BaseFieldProps {
  htmlFor: string;
  children: ReactNode;
}

/** design-system-admin.md §5.8 — no focus transition (instant border-color snap, not a fade). */
const INPUT_CLASSES =
  "w-full rounded-admin-input-select border border-white/10 bg-admin-bg-surface px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:outline-none focus:border-admin-primary";

function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm text-admin-text-secondary">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-admin-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  id,
  ...rest
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} htmlFor={id!} error={error}>
      <input id={id} className={INPUT_CLASSES} {...rest} />
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  error,
  id,
  ...rest
}: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} htmlFor={id!} error={error}>
      <textarea id={id} className={INPUT_CLASSES} rows={4} {...rest} />
    </FieldWrapper>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  error,
  id,
  options,
  ...rest
}: BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <FieldWrapper label={label} htmlFor={id!} error={error}>
      <select id={id} className={INPUT_CLASSES} {...rest}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
