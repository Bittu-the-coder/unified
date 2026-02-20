import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="warning">Unified Super App</Badge>
        <ThemeToggle />
      </div>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-4xl">
            <Sparkles className="h-7 w-7 text-accent" />
            Build. Communicate. Focus.
          </CardTitle>
          <CardDescription className="max-w-2xl text-base">
            Premium workspace UI for messaging, calls, cloud files, productivity, shopping, AI assistance, and
            notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login" className="gap-2">
              Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/register">Register</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['Messaging & Calls', 'Productivity', 'File Cloud', 'AI + Shopping'].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="text-lg">{item}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

