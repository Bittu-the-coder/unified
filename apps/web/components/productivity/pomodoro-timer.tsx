'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productivityApi } from '@/lib/api';
import { CheckCircle, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const DURATIONS = { focus: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 };

export function PomodoroTimer() {
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => { productivityApi.listTodos().then(setTodos).catch(() => {}); }, []);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && timeLeft === 0 && sessionId) {
      completeSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, sessionId]);

  const setTimerMode = (m: 'focus' | 'short_break' | 'long_break') => {
    if (isRunning) return;
    setMode(m);
    setTimeLeft(DURATIONS[m]);
  };

  const startTimer = async () => {
    if (sessionId) {
      setIsRunning(true);
      return;
    }
    try {
      const created = await productivityApi.createPomodoro({ sessionType: mode, duration: DURATIONS[mode], taskId: selectedTask || undefined, startedAt: new Date().toISOString() });
      setSessionId(created._id);
      setIsRunning(true);
      toast.success('Pomodoro started!');
    } catch (e) { toast.error('Failed to start'); }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    try {
      const completed = Math.max(0, DURATIONS[mode] - timeLeft);
      await productivityApi.completePomodoro(sessionId, { completedDuration: completed });
      setSessionId(null);
      setIsRunning(false);
      setTimeLeft(DURATIONS[mode]);
      if (mode === 'focus') toast.success('Focus session complete! Take a break.');
      else toast.success('Break is over! Back to work.');
    } catch (e) { toast.error('Failed to save session'); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;

  return (
    <Card className="glass-card border-border/40 overflow-hidden relative border-t-[6px]" style={{ borderTopColor: mode === 'focus' ? 'var(--accent)' : 'var(--secondary)'}}>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Pomodoro</CardTitle>
        <CardDescription>Stay focused with timed sprints</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4 flex flex-col items-center">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          {(['focus', 'short_break', 'long_break'] as const).map(m => (
            <button key={m} onClick={() => setTimerMode(m)} disabled={isRunning} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === m ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {m.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative flex flex-col items-center justify-center w-56 h-56 rounded-full border-[8px] bg-surface/50 shadow-inner group transition-all" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-6xl font-black tracking-tighter text-foreground tabular-nums">
            {formatTime(timeLeft)}
          </h2>
          <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{mode.replace('_', ' ')}</p>
        </div>

        <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} disabled={isRunning} className="w-full max-w-xs h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">No task linked</option>
          {todos.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>

        <div className="flex gap-3">
          <Button onClick={() => isRunning ? setIsRunning(false) : startTimer()} size="lg" className="w-28 rounded-full shadow-lg font-bold text-white bg-primary hover:bg-primary/90">
            {isRunning ? <Pause className="mr-2 h-4 w-4 fill-white" /> : <Play className="mr-2 h-4 w-4 fill-white" />}
            {isRunning ? 'PAUSE' : 'START'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setIsRunning(false); setTimeLeft(DURATIONS[mode]); setSessionId(null); }} className="rounded-full w-12 h-12 shadow-sm border-border/80">
            <RotateCcw className="h-5 w-5" />
          </Button>
          {sessionId && !isRunning && (
            <Button variant="secondary" size="icon" onClick={completeSession} className="rounded-full w-12 h-12 shadow-md">
              <CheckCircle className="h-5 w-5 fill-white" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
