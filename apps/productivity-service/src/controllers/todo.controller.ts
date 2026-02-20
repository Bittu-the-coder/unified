import type { Response } from 'express';
import { ok, type AuthenticatedRequest } from '@unified/shared';
import { TodoService } from '../services/todo.service';

export class TodoController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const todos = await TodoService.list(req.user!.id, {
      status: req.query.status as 'pending' | 'in_progress' | 'completed' | undefined,
      priority: req.query.priority as 'low' | 'medium' | 'high' | undefined,
      categoryId: req.query.categoryId as string | undefined,
      search: req.query.search as string | undefined,
    });
    return ok(res, todos, 'Todos fetched');
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const todo = await TodoService.create(req.user!.id, req.body);
    return ok(res, todo, 'Todo created', 201);
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const todo = await TodoService.update(req.user!.id, id, req.body);
    return ok(res, todo, 'Todo updated');
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    await TodoService.remove(req.user!.id, id);
    return ok(res, null, 'Todo deleted');
  }

  static async recordProgress(req: AuthenticatedRequest, res: Response) {
    const record = await TodoService.recordProgress(req.user!.id, req.body);
    return ok(res, record, 'Progress recorded', 201);
  }

  static async listProgress(req: AuthenticatedRequest, res: Response) {
    const progress = await TodoService.listProgress(req.user!.id);
    return ok(res, progress, 'Progress fetched');
  }

  static async listCategories(req: AuthenticatedRequest, res: Response) {
    const categories = await TodoService.listCategories(req.user!.id);
    return ok(res, categories, 'Categories fetched');
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    const category = await TodoService.createCategory(req.user!.id, req.body);
    return ok(res, category, 'Category created', 201);
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    const category = await TodoService.updateCategory(req.user!.id, String(req.params.id), req.body);
    return ok(res, category, 'Category updated');
  }

  static async removeCategory(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeCategory(req.user!.id, String(req.params.id));
    return ok(res, null, 'Category deleted');
  }

  static async listDependencies(req: AuthenticatedRequest, res: Response) {
    const dependencies = await TodoService.listDependencies(req.user!.id, String(req.params.taskId));
    return ok(res, dependencies, 'Dependencies fetched');
  }

  static async addDependency(req: AuthenticatedRequest, res: Response) {
    const dependency = await TodoService.addDependency(req.user!.id, req.body);
    return ok(res, dependency, 'Dependency added', 201);
  }

  static async removeDependency(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeDependency(
      req.user!.id,
      String(req.params.taskId),
      String(req.params.dependsOnTaskId),
    );
    return ok(res, null, 'Dependency removed');
  }

  static async listCalendarEvents(req: AuthenticatedRequest, res: Response) {
    const events = await TodoService.listCalendarEvents(req.user!.id);
    return ok(res, events, 'Calendar events fetched');
  }

  static async createCalendarEvent(req: AuthenticatedRequest, res: Response) {
    const event = await TodoService.createCalendarEvent(req.user!.id, req.body);
    return ok(res, event, 'Calendar event created', 201);
  }

  static async updateCalendarEvent(req: AuthenticatedRequest, res: Response) {
    const event = await TodoService.updateCalendarEvent(req.user!.id, String(req.params.id), req.body);
    return ok(res, event, 'Calendar event updated');
  }

  static async removeCalendarEvent(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeCalendarEvent(req.user!.id, String(req.params.id));
    return ok(res, null, 'Calendar event deleted');
  }

  static async listNotebooks(req: AuthenticatedRequest, res: Response) {
    const notebooks = await TodoService.listNotebooks(req.user!.id);
    return ok(res, notebooks, 'Notebooks fetched');
  }

  static async createNotebook(req: AuthenticatedRequest, res: Response) {
    const notebook = await TodoService.createNotebook(req.user!.id, req.body);
    return ok(res, notebook, 'Notebook created', 201);
  }

  static async updateNotebook(req: AuthenticatedRequest, res: Response) {
    const notebook = await TodoService.updateNotebook(req.user!.id, String(req.params.id), req.body);
    return ok(res, notebook, 'Notebook updated');
  }

  static async removeNotebook(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeNotebook(req.user!.id, String(req.params.id));
    return ok(res, null, 'Notebook deleted');
  }

  static async listNotes(req: AuthenticatedRequest, res: Response) {
    const notes = await TodoService.listNotes(req.user!.id, req.query.notebookId as string | undefined);
    return ok(res, notes, 'Notes fetched');
  }

  static async createNote(req: AuthenticatedRequest, res: Response) {
    const note = await TodoService.createNote(req.user!.id, req.body);
    return ok(res, note, 'Note created', 201);
  }

  static async updateNote(req: AuthenticatedRequest, res: Response) {
    const note = await TodoService.updateNote(req.user!.id, String(req.params.id), req.body);
    return ok(res, note, 'Note updated');
  }

  static async removeNote(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeNote(req.user!.id, String(req.params.id));
    return ok(res, null, 'Note deleted');
  }

  static async listNoteVersions(req: AuthenticatedRequest, res: Response) {
    const versions = await TodoService.listNoteVersions(req.user!.id, String(req.params.noteId));
    return ok(res, versions, 'Note versions fetched');
  }

  static async listTimeEntries(req: AuthenticatedRequest, res: Response) {
    const entries = await TodoService.listTimeEntries(req.user!.id);
    return ok(res, entries, 'Time entries fetched');
  }

  static async createTimeEntry(req: AuthenticatedRequest, res: Response) {
    const entry = await TodoService.createTimeEntry(req.user!.id, req.body);
    return ok(res, entry, 'Time entry created', 201);
  }

  static async updateTimeEntry(req: AuthenticatedRequest, res: Response) {
    const entry = await TodoService.updateTimeEntry(req.user!.id, String(req.params.id), req.body);
    return ok(res, entry, 'Time entry updated');
  }

  static async removeTimeEntry(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeTimeEntry(req.user!.id, String(req.params.id));
    return ok(res, null, 'Time entry deleted');
  }

  static async listPomodoroSessions(req: AuthenticatedRequest, res: Response) {
    const sessions = await TodoService.listPomodoroSessions(req.user!.id);
    return ok(res, sessions, 'Pomodoro sessions fetched');
  }

  static async createPomodoro(req: AuthenticatedRequest, res: Response) {
    const session = await TodoService.createPomodoro(req.user!.id, req.body);
    return ok(res, session, 'Pomodoro session created', 201);
  }

  static async completePomodoro(req: AuthenticatedRequest, res: Response) {
    const session = await TodoService.completePomodoro(req.user!.id, String(req.params.id), req.body);
    return ok(res, session, 'Pomodoro session completed');
  }

  static async listFocusGoals(req: AuthenticatedRequest, res: Response) {
    const goals = await TodoService.listFocusGoals(req.user!.id);
    return ok(res, goals, 'Focus goals fetched');
  }

  static async createFocusGoal(req: AuthenticatedRequest, res: Response) {
    const goal = await TodoService.createFocusGoal(req.user!.id, req.body);
    return ok(res, goal, 'Focus goal created', 201);
  }

  static async updateFocusGoal(req: AuthenticatedRequest, res: Response) {
    const goal = await TodoService.updateFocusGoal(req.user!.id, String(req.params.id), req.body);
    return ok(res, goal, 'Focus goal updated');
  }

  static async removeFocusGoal(req: AuthenticatedRequest, res: Response) {
    await TodoService.removeFocusGoal(req.user!.id, String(req.params.id));
    return ok(res, null, 'Focus goal deleted');
  }
}
