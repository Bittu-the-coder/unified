import { serviceTiles } from './data';

export function ServiceShowcase() {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unified Services</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {serviceTiles.map((tile) => (
          <article
            key={tile.title}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface px-4 py-5"
          >
            <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${tile.accent}`} />
            <div className="absolute inset-[1px] rounded-2xl bg-surface" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex rounded-lg bg-muted p-2">
                <tile.icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-sm font-semibold">{tile.title}</h3>
              <p className="text-xs text-muted-foreground">Designed as independent modules with shared UX patterns.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
