'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productivityApi, type CalendarEvent } from '@/lib/api';
import { CalendarDays, CalendarPlus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function CalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setEvents(await productivityApi.listCalendarEvents()); } catch (e) {}
  };

  const add = async () => {
    if (!title.trim()) return;
    try {
      const s = new Date(); const e = new Date(Date.now() + 60 * 60 * 1000);
      await productivityApi.createCalendarEvent({ title: title.trim(), startTime: s.toISOString(), endTime: e.toISOString() });
      setTitle(''); await load(); toast.success('Event added');
    } catch (e) { toast.error('Error adding event'); }
  };

  const del = async (id: string) => {
    try { await productivityApi.deleteCalendarEvent(id); await load(); } catch (e) {}
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><CalendarDays className="h-5 w-5 text-accent"/> Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Quick event (adds +1hr from now)" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="bg-background/50 border-border/50" />
          <Button variant="secondary" onClick={add}><CalendarPlus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e._id} className="flex items-center justify-between glass-panel p-3 rounded-xl transition-all group hover:bg-surface/60 border border-white/40 shadow-sm">
              <div>
                <p className="font-semibold text-sm">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button onClick={() => del(e._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground py-2 italic text-center">No upcoming events.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
