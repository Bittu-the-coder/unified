'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { productivityApi, type FocusGoal } from '@/lib/api';
import { Check, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function FocusGoals() {
  const [goals, setGoals] = useState<FocusGoal[]>([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setGoals(await productivityApi.listFocusGoals()); } catch (e) {}
  };

  const add = async () => {
    if (!newGoal.trim()) return;
    try {
      const s = new Date(); const e = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await productivityApi.createFocusGoal({ name: newGoal.trim(), targetHours: 10, period: 'weekly', startDate: s.toISOString(), endDate: e.toISOString() });
      setNewGoal(''); await load(); toast.success('Goal added');
    } catch (e) { toast.error('Error adding goal'); }
  };

  const increment = async (goal: FocusGoal) => {
    try {
      await productivityApi.updateFocusGoal(goal._id, { progressHours: goal.progressHours + 1 });
      await load();
    } catch (e) {}
  };

  const del = async (id: string) => {
    try { await productivityApi.deleteFocusGoal(id); await load(); } catch (e) {}
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><Target className="h-5 w-5 text-accent"/> Focus Goals</CardTitle>
        <CardDescription>Track weekly focus hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input placeholder="New weekly goal (10h target)" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="bg-background/50 border-border/50" />
          <Button onClick={add} className="bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = Math.min(100, (g.progressHours / g.targetHours) * 100);
            const done = g.progressHours >= g.targetHours;
            return (
              <div key={g._id} className="relative glass-panel p-4 rounded-xl border border-white/20 shadow-sm overflow-hidden group">
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    {done && <Check className="h-4 w-4 text-emerald-500" />}
                    <h4 className={`font-semibold text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{g.name}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-muted/60 px-2 py-0.5 rounded">{g.progressHours} / {g.targetHours}h</span>
                    <button onClick={() => increment(g)} className="text-accent hover:text-accent/80 transition-colors" title="Add 1 Hour" disabled={done}><Plus className="h-4 w-4" /></button>
                    <button onClick={() => del(g._id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <Progress value={pct} className={`h-1.5 ${done ? 'bg-emerald-500/20' : 'bg-muted'}`} />
              </div>
            );
          })}
          {goals.length === 0 && <p className="text-sm text-muted-foreground py-2 italic text-center">No goals tracked.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
