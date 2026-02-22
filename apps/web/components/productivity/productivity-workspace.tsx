'use client';

import { CalendarEvents } from '@/components/productivity/calendar-events';
import { CategoryManager } from '@/components/productivity/category-manager';
import { FocusGoals } from '@/components/productivity/focus-goals';
import { NotesEditor } from '@/components/productivity/notes-editor';
import { PomodoroTimer } from '@/components/productivity/pomodoro-timer';
import { TaskBoard } from '@/components/productivity/task-board';
import { TimeTracker } from '@/components/productivity/time-tracker';

type Props = { onError: (m: string) => void; onSuccess: (m: string) => void };

export function ProductivityWorkspace({ onError, onSuccess }: Props) {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TaskBoard />
        </div>
        <div className="flex flex-col gap-6">
          <PomodoroTimer />
          <CategoryManager />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TimeTracker />
        <div className="flex flex-col gap-6">
          <FocusGoals />
          <CalendarEvents />
        </div>
      </div>

      <div className="grid gap-6">
        <NotesEditor />
      </div>
    </div>
  );
}
