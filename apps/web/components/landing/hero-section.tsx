import { InstallAppButton } from '@/components/pwa/install-app-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { highlightMetrics } from './data';

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-surface/80 backdrop-blur-xl shadow-xl">
      <div className="relative space-y-6 p-6 sm:p-8 md:p-12 lg:p-14">
        <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <Badge variant="warning" className="px-3 py-1 text-sm bg-accent/20 text-accent border border-accent/30 backdrop-blur-md">Unified Super Platform</Badge>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-balance font-extrabold leading-tight tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            A cohesive workspace for <span className="text-gradient">communication</span>, focus, files, and identity.
          </h1>
          <p className="text-pretty text-base text-muted-foreground md:text-lg max-w-2xl">
            Unified combines modern personal infrastructure into one polished experience with a consistent visual
            system and fast module-based workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button asChild size="lg" className="h-11 px-6 rounded-full shadow-sm hover:shadow-md transition-all font-semibold">
            <Link href="/register" className="gap-2 text-sm">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6 rounded-full border-border/60 bg-surface/50 backdrop-blur-md hover:bg-surface/80 transition-all font-semibold">
            <Link href="/login" className="text-sm">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-11 px-6 rounded-full hover:bg-muted/50 transition-all font-semibold">
            <Link href="/dashboard/overview" className="gap-2 text-sm">
              <img src="/icon.svg" className="h-4 w-4" alt="Dashboard" />
              Open Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {highlightMetrics.map((metric) => (
            <div key={metric.label} className="glass-card rounded-2xl p-4 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
