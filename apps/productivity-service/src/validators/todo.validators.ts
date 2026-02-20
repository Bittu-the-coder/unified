import { z } from 'zod';

export const todoQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.record(z.any()).optional(),
  parentTaskId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  actualDuration: z.number().int().positive().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.record(z.any()).optional(),
  parentTaskId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createDependencySchema = z.object({
  taskId: z.string().min(1),
  dependsOnTaskId: z.string().min(1),
});

export const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isAllDay: z.boolean().optional(),
  recurrencePattern: z.record(z.any()).optional(),
  reminderTime: z.number().int().nonnegative().optional(),
  color: z.string().optional(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

export const createNotebookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentNotebookId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateNotebookSchema = createNotebookSchema.partial();

export const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  color: z.string().optional(),
  notebookId: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const createTimeEntrySchema = z.object({
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  isManual: z.boolean().optional(),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().optional(),
  endTime: z.string().datetime().optional(),
});

export const createPomodoroSchema = z.object({
  taskId: z.string().optional(),
  sessionType: z.enum(['focus', 'short_break', 'long_break']),
  duration: z.number().int().positive(),
  startedAt: z.string().datetime().optional(),
});

export const completePomodoroSchema = z.object({
  completedDuration: z.number().int().nonnegative().optional(),
});

export const createFocusGoalSchema = z.object({
  name: z.string().min(1),
  targetHours: z.number().positive(),
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateFocusGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetHours: z.number().positive().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  progressHours: z.number().nonnegative().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createProgressSchema = z.object({
  todoId: z.string().optional(),
  activityType: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});
