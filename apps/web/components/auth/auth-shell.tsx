import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerLabel: string;
  footerLinkLabel: string;
  footerLinkHref: string;
};

export function AuthShell({
  title,
  description,
  children,
  footerLabel,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden rounded-2xl border border-border bg-surface/80 p-8 lg:block">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Secure Authentication
          </div>
          <h1 className="text-4xl font-semibold leading-tight">{title}</h1>
          <p className="max-w-md text-muted-foreground">{description}</p>
          <div className="grid gap-3">
            {['JWT sessions', 'Role and account controls', 'Cross-service identity sync'].map((item) => (
              <div key={item} className="rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        {children}
        <p className="text-sm text-muted-foreground">
          {footerLabel}{' '}
          <Link className="text-accent underline-offset-4 hover:underline" href={footerLinkHref}>
            {footerLinkLabel}
          </Link>
        </p>
      </section>
    </div>
  );
}
