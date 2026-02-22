import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CtaBand() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-primary p-6 sm:p-10 lg:p-12 text-white shadow-xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Start Building</p>
          <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight leading-tight">Launch your unified daily workspace now.</h2>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 lg:flex-nowrap">
          <Button asChild size="lg" className="h-12 px-6 text-sm rounded-full bg-accent text-white hover:bg-[#ff7e2d] hover:scale-105 transition-all shadow-sm font-semibold border-none">
            <Link href="/register" className="gap-2">
              Create Account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-md transition-all font-semibold">
            <Link href="/dashboard/overview">Try Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
