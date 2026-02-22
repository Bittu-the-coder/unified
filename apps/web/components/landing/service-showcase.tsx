import { serviceTiles } from './data';

export function ServiceShowcase() {
  return (
    <section className="space-y-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">Unified Services</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {serviceTiles.map((tile) => (
          <article
            key={tile.title}
            className="group glass relative overflow-hidden rounded-2xl border-border/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border/80"
          >
            <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${tile.accent}`} />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex rounded-xl bg-surface/80 p-3 shadow-sm border border-border/50 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                <tile.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-base font-bold tracking-tight">{tile.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">Designed as independent modules with shared UX patterns.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
