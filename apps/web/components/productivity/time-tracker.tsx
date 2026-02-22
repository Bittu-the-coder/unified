'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productivityApi, type TimeEntry } from '@/lib/api';
import { Clock, PlayCircle, Square, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function TimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeStartMs, setActiveStartMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { load(); productivityApi.listTodos().then(setTodos).catch(()=>{}); }, []);

  const load = async () => {
    try {
      const list = await productivityApi.listTimeEntries();
      setEntries(list);
      const open = list.find((e) => !e.endTime);
      if (open) {
        setActiveEntryId(open._id);
        setActiveStartMs(new Date(open.startTime).getTime());
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(open.startTime).getTime()) / 1000)));
      } else {
        setActiveEntryId(null);
        setActiveStartMs(null);
        setElapsed(0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeStartMs) return;
    const i = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - activeStartMs) / 1000))), 1000);
    return () => clearInterval(i);
  }, [activeStartMs]);

  const startTimer = async () => {
    if (activeEntryId) return;
    try {
      await productivityApi.createTimeEntry({ description: description || 'Focused work', taskId: selectedTask || undefined, startTime: new Date().toISOString(), isManual: false });
      setDescription('');
      setSelectedTask('');
      await load();
      toast.success('Timer started');
    } catch (e) { toast.error('Failed to start timer'); }
  };

  const stopTimer = async () => {
    if (!activeEntryId) return;
    try {
      await productivityApi.updateTimeEntry(activeEntryId, { endTime: new Date().toISOString() });
      await load();
      toast.success('Timer saved');
    } catch (e) { toast.error('Failed to stop timer'); }
  };

  const deleteEntry = async (id: string) => {
    try {
      await productivityApi.deleteTimeEntry(id);
      await load();
    } catch (e) { toast.error('Error deleting entry'); }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Time Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-2xl border border-border/60 p-5 transition-all outline outline-offset-4 outline-transparent ${activeEntryId ? 'bg-accent/5 border-accent/40 shadow-inner outline-accent/20' : 'glass-panel'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex-1 w-full space-y-3">
              <Input placeholder="What are you working on?" value={description} onChange={e => setDescription(e.target.value)} disabled={!!activeEntryId} className="bg-background/80 shadow-sm border-border/60 font-medium" />
              <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} disabled={!!activeEntryId} className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                <option value="">No task linked</option>
                {todos.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[100px]">
                <span className={`text-4xl font-black font-mono tracking-tighter tabular-nums ${activeEntryId ? 'text-accent' : 'text-muted-foreground'}`}>{formatTime(elapsed)}</span>
              </div>
              {activeEntryId ? (
                <Button onClick={stopTimer} size="icon" variant="destructive" className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"><Square className="h-6 w-6 fill-current" /></Button>
              ) : (
                <Button onClick={startTimer} size="icon" className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(255,101,0,0.3)] bg-accent hover:bg-[#ff7e2d] hover:scale-105 transition-all text-white border-none"><PlayCircle className="h-7 w-7 fill-current text-white/10" /></Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-8">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Recent Sessions</h3>
          {entries.filter(e => e.endTime).slice(0, 5).map(e => (
            <div key={e._id} className="flex items-center justify-between glass-panel p-3 rounded-xl border border-white/40 shadow-sm group hover:bg-surface/60 transition-colors">
              <div>
                <p className="font-semibold text-sm">{e.description || 'Focused work'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.startTime).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{formatTime(e.duration || 0)}</span>
                <button onClick={() => deleteEntry(e._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {entries.filter(e => e.endTime).length === 0 && <p className="text-sm text-muted-foreground italic px-1">No past sessions.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
