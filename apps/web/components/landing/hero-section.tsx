import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { highlightMetrics } from './data';

export function HeroSection() {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-surface via-surface to-muted/60">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#FF6500]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#1E3E62]/30 blur-3xl" />
      <CardContent className="relative space-y-6 p-5 sm:p-8 md:space-y-8 md:p-12 lg:space-y-8 lg:p-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="warning">Unified Super Platform</Badge>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-balance font-semibold leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            A cohesive workspace for communication, focus, files, and identity.
          </h1>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            Unified combines modern personal infrastructure into one polished experience with a consistent visual
            system and fast module-based workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button asChild size="lg">
            <Link href="/register" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/dashboard/overview" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Open Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlightMetrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border/80 bg-background/50 px-4 py-3">
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
