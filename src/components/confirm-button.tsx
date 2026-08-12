'use client';

import type { ComponentProps } from 'react';

/** Submit button that asks for confirmation before letting the form submit. */
export function ConfirmButton({
  confirmMessage,
  className = '',
  children,
  ...props
}: ComponentProps<'button'> & { confirmMessage: string }) {
  return (
    <button
      {...props}
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
