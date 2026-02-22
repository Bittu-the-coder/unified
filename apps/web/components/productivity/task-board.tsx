'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productivityApi, type TaskCategory, type Todo } from '@/lib/api';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function TaskBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, c] = await Promise.all([productivityApi.listTodos(), productivityApi.listCategories()]);
      setTodos(t);
      setCategories(c);
    } catch (e) {
      toast.error('Failed to load tasks');
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await productivityApi.createTodo({ title: newTaskTitle.trim(), categoryId: selectedCategory || undefined });
      setNewTaskTitle('');
      await loadData();
      toast.success('Task created');
    } catch (e) {
      toast.error('Error creating task');
    }
  };

  const toggleTask = async (task: Todo) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await productivityApi.updateTodo(task._id, { status: nextStatus });
      await loadData();
    } catch (e) {
      toast.error('Error updating task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await productivityApi.deleteTodo(id);
      await loadData();
    } catch (e) {
      toast.error('Error deleting task');
    }
  };

  const pending = todos.filter(t => t.status !== 'completed');
  const completed = todos.filter(t => t.status === 'completed');

  return (
    <Card className="glass-card border-border/40 flex-1">
      <CardHeader>
        <CardTitle className="text-xl">Task Board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input placeholder="What needs to be done?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} className="bg-background/50 border-border/50" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">No Category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <Button onClick={addTask}><Plus className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending ({pending.length})</h3>
            <div className="space-y-2">
              {pending.map(t => (
                <div key={t._id} className="group flex items-center justify-between glass-panel p-3 rounded-xl transition-all hover:border-primary/40 text-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTask(t)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Circle className="h-5 w-5" />
                    </button>
                    <span className="font-medium">{t.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteTask(t._id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-sm text-muted-foreground italic">All caught up!</p>}
            </div>
          </div>

          <div className="space-y-2 tracking-wider text-muted-foreground">
            <h3 className="text-sm font-semibold uppercase">Completed ({completed.length})</h3>
            <div className="space-y-2">
              {completed.map(t => (
                <div key={t._id} className="group flex items-center justify-between glass-panel p-3 rounded-xl opacity-60 hover:opacity-100 transition-all text-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTask(t)} className="text-primary hover:text-primary/80 transition-colors">
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <span className="font-medium line-through text-muted-foreground">{t.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteTask(t._id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
