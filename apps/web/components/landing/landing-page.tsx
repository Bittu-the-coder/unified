import { CtaBand } from './cta-band';
import { FeatureGrid } from './feature-grid';
import { HeroSection } from './hero-section';
import { ServiceShowcase } from './service-showcase';

export function LandingPage() {
  return (
    <div className="space-y-6 pb-8">
      <HeroSection />
      <FeatureGrid />
      <ServiceShowcase />
      <CtaBand />
    </div>
  );
}
