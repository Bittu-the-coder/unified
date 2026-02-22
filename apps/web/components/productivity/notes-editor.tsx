'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productivityApi, type Note, type Notebook } from '@/lib/api';
import { AlignLeft, BookMarked, BookText, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function NotesEditor() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const [newNotebook, setNewNotebook] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => { loadNotebooks(); }, []);
  useEffect(() => { loadNotes(); setActiveNote(null); setNoteContent(''); }, [activeNotebookId]);

  const loadNotebooks = async () => {
    try { setNotebooks(await productivityApi.listNotebooks()); } catch (e) {}
  };

  const loadNotes = async () => {
    try { setNotes(await productivityApi.listNotes(activeNotebookId || undefined)); } catch (e) {}
  };

  const addNotebook = async () => {
    if (!newNotebook.trim()) return;
    try { await productivityApi.createNotebook({ name: newNotebook }); setNewNotebook(''); await loadNotebooks(); } catch (e) {}
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try { await productivityApi.createNote({ title: newNote, content: '', notebookId: activeNotebookId || undefined }); setNewNote(''); await loadNotes(); } catch (e) {}
  };

  const saveNoteContent = async () => {
    if (!activeNote) return;
    try {
      await productivityApi.updateNote(activeNote._id, { content: noteContent });
      toast.success('Note saved');
      await loadNotes();
    } catch (e) {}
  };

  return (
    <Card className="glass-card border-border/40 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><BookText className="h-5 w-5 text-accent"/> Notes & Notebooks</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
        {/* Notebooks Column */}
        <div className="md:col-span-1 border-r border-border/50 pr-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <Input placeholder="New Notebook" value={newNotebook} onChange={e => setNewNotebook(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNotebook()} className="h-8 text-xs bg-background/50" />
            <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={addNotebook}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="flex-1 overflow-auto space-y-1">
            <button onClick={() => setActiveNotebookId('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!activeNotebookId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}>
              All Notes
            </button>
            {notebooks.map(nb => (
              <div key={nb._id} className="group flex items-center gap-1">
                <button onClick={() => setActiveNotebookId(nb._id)} className={`flex-1 flex gap-2 items-center text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeNotebookId === nb._id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}>
                  <BookMarked className="h-3.5 w-3.5" />
                  <span className="truncate">{nb.name}</span>
                </button>
                <button onClick={async () => { await productivityApi.deleteNotebook(nb._id); if (activeNotebookId === nb._id) setActiveNotebookId(''); await loadNotebooks(); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Column */}
        <div className="md:col-span-1 border-r border-border/50 pr-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <Input placeholder="New Note" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} className="h-8 text-xs bg-background/50" />
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 border-accent/30 text-accent hover:bg-accent hover:text-white" onClick={addNote}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="flex-1 overflow-auto space-y-1">
            {notes.map(n => (
              <div key={n._id} className="group flex items-center gap-1">
                <button onClick={() => { setActiveNote(n); setNoteContent(n.content || ''); }} className={`flex-1 flex flex-col text-left px-3 py-2 rounded-lg transition-colors border ${activeNote?._id === n._id ? 'bg-surface shadow-sm border-border/60' : 'border-transparent hover:bg-muted/50'}`}>
                  <span className={`text-sm font-semibold truncate ${activeNote?._id === n._id ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                  <span className="text-xs text-muted-foreground truncate opacity-70 flex items-center gap-1 mt-0.5"><AlignLeft className="h-2.5 w-2.5" /> {n.content?.substring(0, 20) || 'Empty'}</span>
                </button>
                <button onClick={async () => { await productivityApi.deleteNote(n._id); if (activeNote?._id === n._id) { setActiveNote(null); setNoteContent(''); } await loadNotes(); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No notes found.</p>}
          </div>
        </div>

        {/* Editor Column */}
        <div className="md:col-span-2 flex flex-col gap-3 pl-2">
          {activeNote ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-lg"><Edit3 className="h-5 w-5" /> {activeNote.title}</div>
                <Button onClick={saveNoteContent} size="sm" className="bg-secondary text-white hover:bg-secondary/90 shadow-sm">Save</Button>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 w-full bg-background/50 border border-border/60 rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 font-mono text-sm shadow-inner transition-all"
                placeholder="Start typing..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border/40 rounded-xl m-2 bg-surface/30">
              <BookText className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">Select a note to read or edit</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
