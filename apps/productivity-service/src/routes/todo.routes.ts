import { Router } from 'express';
import { requireAuth, validateBody } from '@unified/shared';
import { TodoController } from '../controllers/todo.controller';
import {
  completePomodoroSchema,
  createCalendarEventSchema,
  createCategorySchema,
  createDependencySchema,
  createFocusGoalSchema,
  createNoteSchema,
  createNotebookSchema,
  createPomodoroSchema,
  createProgressSchema,
  createTimeEntrySchema,
  createTodoSchema,
  updateCalendarEventSchema,
  updateCategorySchema,
  updateFocusGoalSchema,
  updateNoteSchema,
  updateNotebookSchema,
  updateTimeEntrySchema,
  updateTodoSchema,
} from '../validators/todo.validators';

export const todoRouter = Router();

todoRouter.use(requireAuth);

todoRouter.get('/todos', TodoController.list);
todoRouter.post('/todos', validateBody(createTodoSchema), TodoController.create);
todoRouter.patch('/todos/:id', validateBody(updateTodoSchema), TodoController.update);
todoRouter.delete('/todos/:id', TodoController.remove);

todoRouter.get('/task-categories', TodoController.listCategories);
todoRouter.post('/task-categories', validateBody(createCategorySchema), TodoController.createCategory);
todoRouter.patch('/task-categories/:id', validateBody(updateCategorySchema), TodoController.updateCategory);
todoRouter.delete('/task-categories/:id', TodoController.removeCategory);

todoRouter.get('/task-dependencies/:taskId', TodoController.listDependencies);
todoRouter.post('/task-dependencies', validateBody(createDependencySchema), TodoController.addDependency);
todoRouter.delete('/task-dependencies/:taskId/:dependsOnTaskId', TodoController.removeDependency);

todoRouter.get('/progress', TodoController.listProgress);
todoRouter.post('/progress', validateBody(createProgressSchema), TodoController.recordProgress);

todoRouter.get('/calendar-events', TodoController.listCalendarEvents);
todoRouter.post('/calendar-events', validateBody(createCalendarEventSchema), TodoController.createCalendarEvent);
todoRouter.patch('/calendar-events/:id', validateBody(updateCalendarEventSchema), TodoController.updateCalendarEvent);
todoRouter.delete('/calendar-events/:id', TodoController.removeCalendarEvent);

todoRouter.get('/notebooks', TodoController.listNotebooks);
todoRouter.post('/notebooks', validateBody(createNotebookSchema), TodoController.createNotebook);
todoRouter.patch('/notebooks/:id', validateBody(updateNotebookSchema), TodoController.updateNotebook);
todoRouter.delete('/notebooks/:id', TodoController.removeNotebook);

todoRouter.get('/notes', TodoController.listNotes);
todoRouter.post('/notes', validateBody(createNoteSchema), TodoController.createNote);
todoRouter.patch('/notes/:id', validateBody(updateNoteSchema), TodoController.updateNote);
todoRouter.delete('/notes/:id', TodoController.removeNote);
todoRouter.get('/notes/:noteId/versions', TodoController.listNoteVersions);

todoRouter.get('/time-entries', TodoController.listTimeEntries);
todoRouter.post('/time-entries', validateBody(createTimeEntrySchema), TodoController.createTimeEntry);
todoRouter.patch('/time-entries/:id', validateBody(updateTimeEntrySchema), TodoController.updateTimeEntry);
todoRouter.delete('/time-entries/:id', TodoController.removeTimeEntry);

todoRouter.get('/pomodoro-sessions', TodoController.listPomodoroSessions);
todoRouter.post('/pomodoro-sessions', validateBody(createPomodoroSchema), TodoController.createPomodoro);
todoRouter.patch('/pomodoro-sessions/:id/complete', validateBody(completePomodoroSchema), TodoController.completePomodoro);

todoRouter.get('/focus-goals', TodoController.listFocusGoals);
todoRouter.post('/focus-goals', validateBody(createFocusGoalSchema), TodoController.createFocusGoal);
todoRouter.patch('/focus-goals/:id', validateBody(updateFocusGoalSchema), TodoController.updateFocusGoal);
todoRouter.delete('/focus-goals/:id', TodoController.removeFocusGoal);
