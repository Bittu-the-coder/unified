'use client';

import { FontOption, useFont } from '@/components/providers/font-provider';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Type } from 'lucide-react';

const fonts: { label: string; value: FontOption; desc: string }[] = [
  { label: 'Inter', value: 'inter', desc: 'Sleek & Modern' },
  { label: 'Roboto', value: 'roboto', desc: 'Clean & Professional' },
  { label: 'DM Sans', value: 'dm-sans', desc: 'Geometric & Friendly' },
  { label: 'Jakarta', value: 'plus-jakarta', desc: 'Sharp & Corporate' },
  { label: 'Outfit', value: 'outfit', desc: 'Tech & Vibrant' },
  { label: 'Raleway', value: 'raleway', desc: 'Elegant & Crisp' },
];

export function FontSwitcher() {
  const { font, setFont } = useFont();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 border-border/60 rounded-full text-foreground hover:bg-surface transition-all shadow-sm"
          title="Change Font"
        >
          <Type className="h-4 w-4" />
          <span className="sr-only">Change font</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-surface/95 backdrop-blur-md p-2 shadow-xl border-border/50">
        <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Typography</p>
        <div className="space-y-1">
          {fonts.map((f) => {
            const isActive = font === f.value;
            return (
              <DropdownMenuItem
                key={f.value}
                onClick={() => setFont(f.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-xl cursor-pointer p-2 transition-all',
                  isActive ? 'bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary' : 'hover:bg-muted focus:bg-muted text-foreground'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn('text-sm font-semibold', isActive && 'text-primary')}>
                    {f.label}
                  </span>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />}
                </div>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-primary/70' : 'text-muted-foreground')}>
                  {f.desc}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
