import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { coreFeatures } from './data';

export function FeatureGrid() {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Core Capabilities</p>
      <div className="grid gap-4 md:grid-cols-2">
        {coreFeatures.map((feature) => (
          <Card key={feature.title} className="group bg-surface/90 transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <feature.icon className="h-5 w-5 text-accent" />
                {feature.title}
              </CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              Modular architecture, typed API integrations, and cohesive workspace UX.
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
