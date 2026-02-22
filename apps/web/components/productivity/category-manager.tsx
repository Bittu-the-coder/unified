'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productivityApi, type TaskCategory } from '@/lib/api';
import { FolderSync, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function CategoryManager() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setCategories(await productivityApi.listCategories()); } catch (e) {}
  };

  const add = async () => {
    if (!newCat.trim()) return;
    try { await productivityApi.createCategory({ name: newCat }); setNewCat(''); await load(); } catch (e) { toast.error('Error adding category'); }
  };

  const del = async (id: string) => {
    try { await productivityApi.deleteCategory(id); await load(); } catch (e) { toast.error('Error removing category'); }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><FolderSync className="h-5 w-5 text-accent"/> Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="New Category" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="bg-background/50 border-border/50" />
          <Button variant="secondary" onClick={add}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div key={c._id} className="flex items-center gap-1 glass-panel px-3 py-1.5 rounded-full text-sm shadow-sm border-border/60">
              <span className="font-medium text-foreground">{c.name}</span>
              <button onClick={() => del(c._id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground w-full py-2 italic">No categories yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
