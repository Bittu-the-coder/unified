import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { coreFeatures } from './data';

export function FeatureGrid() {
  return (
    <section className="space-y-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Core Capabilities</p>
      <div className="grid gap-6 md:grid-cols-2">
        {coreFeatures.map((feature) => (
          <Card key={feature.title} className="group glass-card border-border/40 bg-surface/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-accent/40 hover:bg-surface/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="rounded-xl bg-accent/10 p-2 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                {feature.title}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground/80 font-medium">
              Modular architecture, typed API integrations, and cohesive workspace UX.
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
