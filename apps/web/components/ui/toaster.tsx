'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        className: 'border border-border bg-surface text-foreground shadow-lg',
        duration: 3000,
        style: {
          background: 'var(--surface)',
          color: 'var(--foreground)',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: 'var(--secondary)',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--accent)',
            secondary: 'white',
          },
        }
      }}
    />
  );
}
