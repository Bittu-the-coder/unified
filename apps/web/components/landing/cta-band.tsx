import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaBand() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-[#1E3E62] via-[#0B192C] to-[#255F38] p-5 sm:p-8 lg:p-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,101,0,0.35),transparent_45%)]" />
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Start Building</p>
          <h2 className="text-2xl font-semibold md:text-3xl">Launch your unified daily workspace now.</h2>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:flex-nowrap">
          <Button asChild size="lg" className="bg-[#FF6500] text-white hover:bg-[#ff7e2d]">
            <Link href="/register" className="gap-2">
              Create Account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link href="/dashboard/overview">Try Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
