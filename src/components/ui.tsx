import type { ComponentProps, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-clay text-card hover:bg-clay-deep',
  secondary: 'border border-clay/30 bg-card text-clay hover:border-clay/60 hover:bg-shell/40',
  ghost: 'text-ink-soft hover:bg-shell/50 hover:text-ink',
  danger: 'border border-danger/40 bg-card text-danger hover:bg-danger-tint',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
    />
  );
}

const fieldBase =
  'w-full rounded-xl border border-sand bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/25';

export function Input({
  className = '',
  ...props
}: ComponentProps<'input'>) {
  return <input {...props} className={`${fieldBase} ${className}`} />;
}

export function Textarea({
  className = '',
  ...props
}: ComponentProps<'textarea'>) {
  return <textarea {...props} className={`${fieldBase} min-h-24 ${className}`} />;
}

export function Select({
  className = '',
  ...props
}: ComponentProps<'select'>) {
  return <select {...props} className={`${fieldBase} appearance-none ${className}`} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-soft">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: 'error' | 'success' | null;
  message?: string;
}) {
  if (!status || !message) return null;
  return (
    <p
      role={status === 'error' ? 'alert' : 'status'}
      className={`rounded-xl px-3.5 py-2.5 text-sm font-medium ${
        status === 'error' ? 'bg-danger-tint text-danger' : 'bg-leaf-tint text-leaf'
      }`}
    >
      {message}
    </p>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-bold tracking-[0.18em] uppercase text-clay ${className}`}>
      {children}
    </p>
  );
}
