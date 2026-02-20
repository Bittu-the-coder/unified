'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, CirclePlay, Clock3, Link2, ListTodo, Pause, Plus, Square, TimerReset, Trash2 } from 'lucide-react';
import { productivityApi, type PomodoroSession, type ProgressRecord, type TaskCategory, type TaskDependency, type TimeEntry, type Todo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = { onError: (m: string) => void; onSuccess: (m: string) => void };
const d = { focus: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 } as const;
const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function ProductivityWorkspace({ onError, onSuccess }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [events, setEvents] = useState<{ _id: string; title: string; startTime: string }[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [pomodoros, setPomodoros] = useState<PomodoroSession[]>([]);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoCategoryId, setTodoCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [depTaskId, setDepTaskId] = useState('');
  const [depDependsOnId, setDepDependsOnId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [trackerTaskId, setTrackerTaskId] = useState('');
  const [trackerDescription, setTrackerDescription] = useState('Deep work');
  const [trackerEntryId, setTrackerEntryId] = useState<string | null>(null);
  const [trackerStartMs, setTrackerStartMs] = useState<number | null>(null);
  const [trackerElapsed, setTrackerElapsed] = useState(0);
  const [pMode, setPMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [pTaskId, setPTaskId] = useState('');
  const [pSessionId, setPSessionId] = useState<string | null>(null);
  const [pRunning, setPRunning] = useState(false);
  const [pLeft, setPLeft] = useState(d.focus);

  const tMap = useMemo(() => new Map(todos.map((t) => [t._id, t.title])), [todos]);

  const load = async () => {
    const [todoRes, catRes, progRes, eventRes, timeRes, pomoRes] = await Promise.all([
      productivityApi.listTodos(),
      productivityApi.listCategories(),
      productivityApi.listProgress(),
      productivityApi.listCalendarEvents(),
      productivityApi.listTimeEntries(),
      productivityApi.listPomodoroSessions(),
    ]);
    setTodos(todoRes);
    setCategories(catRes);
    setProgress(progRes);
    setEvents(eventRes.map((e) => ({ _id: e._id, title: e.title, startTime: e.startTime })));
    setTimeEntries(timeRes);
    setPomodoros(pomoRes);
  };

  useEffect(() => {
    void load().catch((e) => onError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!depTaskId) return setDependencies([]);
    void productivityApi.listDependencies(depTaskId).then(setDependencies).catch((e) => onError((e as Error).message));
  }, [depTaskId, onError]);

  useEffect(() => {
    const open = timeEntries.find((e) => !e.endTime);
    if (!open) return;
    setTrackerEntryId(open._id);
    setTrackerStartMs(new Date(open.startTime).getTime());
    setTrackerElapsed(Math.max(0, Math.floor((Date.now() - new Date(open.startTime).getTime()) / 1000)));
  }, [timeEntries]);

  useEffect(() => {
    if (!trackerStartMs) return;
    const i = setInterval(() => setTrackerElapsed(Math.max(0, Math.floor((Date.now() - trackerStartMs) / 1000))), 1000);
    return () => clearInterval(i);
  }, [trackerStartMs]);

  useEffect(() => {
    if (!pRunning) return;
    const i = setInterval(() => setPLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(i);
  }, [pRunning]);

  useEffect(() => {
    if (!pRunning || pLeft > 0 || !pSessionId) return;
    void productivityApi.completePomodoro(pSessionId, { completedDuration: d[pMode] }).then(async () => {
      setPRunning(false);
      setPSessionId(null);
      onSuccess('Pomodoro completed');
      await load();
    }).catch((e) => onError((e as Error).message));
  }, [pLeft, pRunning, pSessionId, pMode]);

  const addTodo = async () => {
    if (!todoTitle.trim()) return;
    try {
      await productivityApi.createTodo({ title: todoTitle.trim(), categoryId: todoCategoryId || undefined });
      setTodoTitle(''); setTodoCategoryId(''); await load();
    } catch (e) { onError((e as Error).message); }
  };
  const nextTodo = async (t: Todo) => {
    const n = t.status === 'pending' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'pending';
    try { await productivityApi.updateTodo(t._id, { status: n }); await load(); } catch (e) { onError((e as Error).message); }
  };
  const delTodo = async (id: string) => { try { await productivityApi.deleteTodo(id); await load(); } catch (e) { onError((e as Error).message); } };
  const addCategory = async () => { if (!categoryName.trim()) return; try { await productivityApi.createCategory({ name: categoryName.trim() }); setCategoryName(''); await load(); } catch (e) { onError((e as Error).message); } };
  const delCategory = async (id: string) => { try { await productivityApi.deleteCategory(id); await load(); } catch (e) { onError((e as Error).message); } };
  const addDep = async () => {
    if (!depTaskId || !depDependsOnId || depTaskId === depDependsOnId) return;
    try { await productivityApi.addDependency({ taskId: depTaskId, dependsOnTaskId: depDependsOnId }); setDepDependsOnId(''); setDependencies(await productivityApi.listDependencies(depTaskId)); }
    catch (e) { onError((e as Error).message); }
  };
  const delDep = async (taskId: string, dependsOnTaskId: string) => {
    try { await productivityApi.removeDependency(taskId, dependsOnTaskId); setDependencies(await productivityApi.listDependencies(taskId)); }
    catch (e) { onError((e as Error).message); }
  };
  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    const s = new Date(); const e = new Date(Date.now() + 60 * 60 * 1000);
    try { await productivityApi.createCalendarEvent({ title: eventTitle.trim(), startTime: s.toISOString(), endTime: e.toISOString() }); setEventTitle(''); await load(); }
    catch (err) { onError((err as Error).message); }
  };
  const delEvent = async (id: string) => { try { await productivityApi.deleteCalendarEvent(id); await load(); } catch (e) { onError((e as Error).message); } };
  const startTracker = async () => {
    if (trackerEntryId) return;
    try {
      const now = new Date();
      const row = await productivityApi.createTimeEntry({ description: trackerDescription || 'Deep work', taskId: trackerTaskId || undefined, startTime: now.toISOString(), isManual: false });
      setTrackerEntryId(row._id); setTrackerStartMs(now.getTime()); setTrackerElapsed(0); onSuccess('Timer started'); await load();
    } catch (e) { onError((e as Error).message); }
  };
  const stopTracker = async () => {
    if (!trackerEntryId) return;
    try {
      await productivityApi.updateTimeEntry(trackerEntryId, { endTime: new Date().toISOString() });
      await productivityApi.createProgress({ todoId: trackerTaskId || undefined, activityType: 'time_tracking', durationSeconds: trackerElapsed });
      setTrackerEntryId(null); setTrackerStartMs(null); setTrackerElapsed(0); onSuccess('Timer stopped'); await load();
    } catch (e) { onError((e as Error).message); }
  };
  const delTime = async (id: string) => { try { await productivityApi.deleteTimeEntry(id); await load(); } catch (e) { onError((e as Error).message); } };
  const startPomodoro = async () => {
    if (pSessionId) return;
    try {
      const created = await productivityApi.createPomodoro({ sessionType: pMode, duration: d[pMode], taskId: pTaskId || undefined, startedAt: new Date().toISOString() });
      setPSessionId(created._id); setPLeft(d[pMode]); setPRunning(true); onSuccess('Pomodoro started'); await load();
    } catch (e) { onError((e as Error).message); }
  };
  const completeEarly = async () => {
    if (!pSessionId) return;
    try {
      const done = Math.max(0, d[pMode] - pLeft);
      await productivityApi.completePomodoro(pSessionId, { completedDuration: done });
      await productivityApi.createProgress({ todoId: pTaskId || undefined, activityType: 'pomodoro', durationSeconds: done });
      setPSessionId(null); setPRunning(false); setPLeft(d[pMode]); onSuccess('Pomodoro saved'); await load();
    } catch (e) { onError((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Card><CardContent className="p-3 text-sm">{todos.length} tasks</CardContent></Card>
        <Card><CardContent className="p-3 text-sm">{timeEntries.length} sessions</CardContent></Card>
        <Card><CardContent className="p-3 text-sm">{events.length} events</CardContent></Card>
        <Card><CardContent className="p-3 text-sm">{progress.length} records</CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ListTodo className="h-5 w-5 text-accent" />Tasks</CardTitle><CardDescription>No raw IDs. Everything via dropdowns.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Input placeholder="New task" value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} />
              <select value={todoCategoryId} onChange={(e) => setTodoCategoryId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                <option value="">Category</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <Button onClick={addTodo}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input placeholder="New category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              <Button variant="secondary" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">{categories.map((c) => <Button key={c._id} size="sm" variant="outline" onClick={() => void delCategory(c._id)} className="gap-2">{c.name}<Trash2 className="h-3.5 w-3.5" /></Button>)}</div>
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><Link2 className="h-3.5 w-3.5" />Dependencies</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={depTaskId} onChange={(e) => setDepTaskId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">Task</option>{todos.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
                <select value={depDependsOnId} onChange={(e) => setDepDependsOnId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">Depends on</option>{todos.filter((t) => t._id !== depTaskId).map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
              <Button variant="outline" onClick={addDep}>Link</Button>
              <div className="space-y-1">{dependencies.map((x) => <div key={x._id} className="flex items-center justify-between rounded-lg border border-border px-2 py-1 text-xs"><span>{tMap.get(x.taskId) ?? 'Task'} {'<-'} {tMap.get(x.dependsOnTaskId) ?? 'Task'}</span><button onClick={() => void delDep(x.taskId, x.dependsOnTaskId)}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">{todos.map((t) => <div key={t._id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.status.replace('_', ' ')} · {t.priority}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => void nextTodo(t)}><Check className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => void delTodo(t._id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-accent" />Real Timer + Pomodoro</CardTitle><CardDescription>Real running clocks with backend save.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracker</p><p className="text-3xl font-semibold">{fmt(trackerElapsed)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={trackerTaskId} onChange={(e) => setTrackerTaskId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="">No task</option>{todos.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}</select>
                <Input placeholder="Session label" value={trackerDescription} onChange={(e) => setTrackerDescription(e.target.value)} />
              </div>
              <div className="flex gap-2"><Button onClick={startTracker} disabled={Boolean(trackerEntryId)}><CirclePlay className="h-4 w-4" /></Button><Button variant="secondary" onClick={stopTracker} disabled={!trackerEntryId}><Square className="h-4 w-4" /></Button></div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pomodoro</p><p className="text-3xl font-semibold">{fmt(pLeft)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={pMode} onChange={(e) => { const m = e.target.value as 'focus' | 'short_break' | 'long_break'; setPMode(m); if (!pSessionId) setPLeft(d[m]); }} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="focus">Focus 25m</option><option value="short_break">Short 5m</option><option value="long_break">Long 15m</option></select>
                <select value={pTaskId} onChange={(e) => setPTaskId(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="">No task</option>{todos.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}</select>
              </div>
              <div className="flex gap-2"><Button onClick={startPomodoro} disabled={Boolean(pSessionId)}><CirclePlay className="h-4 w-4" /></Button><Button variant="outline" onClick={() => setPRunning((v) => !v)} disabled={!pSessionId}>{pRunning ? <Pause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}</Button><Button variant="secondary" onClick={completeEarly} disabled={!pSessionId}><Check className="h-4 w-4" /></Button><Button variant="ghost" onClick={() => { setPRunning(false); setPLeft(d[pMode]); }}><TimerReset className="h-4 w-4" /></Button></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input placeholder="Quick event" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} /><Button onClick={addEvent}><CalendarPlus className="h-4 w-4" /></Button></div>
            <div className="max-h-24 space-y-1 overflow-auto">{events.map((e) => <div key={e._id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs"><span>{e.title}</span><button onClick={() => void delEvent(e._id)}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>
            <div className="max-h-28 space-y-1 overflow-auto">{timeEntries.slice(0, 8).map((e) => <div key={e._id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs"><span>{e.description ?? 'Session'} · {fmt(e.duration ?? 0)}</span><button onClick={() => void delTime(e._id)}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>
            <div className="max-h-24 space-y-1 overflow-auto">{pomodoros.slice(0, 8).map((p) => <div key={p._id} className="rounded-md border border-border px-2 py-1 text-xs">{p.sessionType} · {fmt(p.completedDuration ?? p.duration)}</div>)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
