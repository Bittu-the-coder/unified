import { NotFoundError } from '@unified/shared';
import { CalendarEventModel } from '../models/CalendarEvent.model';
import { FocusGoalModel } from '../models/FocusGoal.model';
import { NoteModel } from '../models/Note.model';
import { NotebookModel } from '../models/Notebook.model';
import { NoteVersionModel } from '../models/NoteVersion.model';
import { PomodoroSessionModel } from '../models/PomodoroSession.model';
import { ProgressRecorderModel } from '../models/ProgressRecorder.model';
import { TaskCategoryModel } from '../models/TaskCategory.model';
import { TaskDependencyModel } from '../models/TaskDependency.model';
import { TimeEntryModel } from '../models/TimeEntry.model';
import { TodosModel } from '../models/Todos.model';

export class TodoService {
  static async list(
    userId: string,
    filters?: {
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high';
      categoryId?: string;
      search?: string;
    },
  ) {
    const query: Record<string, unknown> = { userId };

    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;
    if (filters?.categoryId) query.categoryId = filters.categoryId;
    if (filters?.search) query.title = { $regex: filters.search, $options: 'i' };

    return TodosModel.find(query).sort({ createdAt: -1 });
  }

  static async create(
    userId: string,
    payload: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: string;
      estimatedDuration?: number;
      isRecurring?: boolean;
      recurrencePattern?: Record<string, unknown>;
      parentTaskId?: string;
      categoryId?: string;
    },
  ) {
    return TodosModel.create({
      userId,
      title: payload.title,
      description: payload.description,
      priority: payload.priority ?? 'medium',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      estimatedDuration: payload.estimatedDuration,
      isRecurring: payload.isRecurring ?? false,
      recurrencePattern: payload.recurrencePattern,
      parentTaskId: payload.parentTaskId,
      categoryId: payload.categoryId,
    });
  }

  static async update(
    userId: string,
    id: string,
    payload: {
      title?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      status?: 'pending' | 'in_progress' | 'completed';
      dueDate?: string;
      estimatedDuration?: number;
      actualDuration?: number;
      isRecurring?: boolean;
      recurrencePattern?: Record<string, unknown>;
      parentTaskId?: string;
      categoryId?: string;
    },
  ) {
    const todo = await TodosModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
        completedAt: payload.status === 'completed' ? new Date() : undefined,
      },
      { new: true },
    );
    if (!todo) {
      throw new NotFoundError('Todo not found');
    }
    return todo;
  }

  static async remove(userId: string, id: string) {
    await TodosModel.deleteOne({ _id: id, userId });
  }

  static async listCategories(userId: string) {
    return TaskCategoryModel.find({ userId }).sort({ createdAt: -1 });
  }

  static async createCategory(userId: string, payload: { name: string; color?: string; icon?: string }) {
    return TaskCategoryModel.create({ userId, ...payload });
  }

  static async updateCategory(userId: string, id: string, payload: { name?: string; color?: string; icon?: string }) {
    const category = await TaskCategoryModel.findOneAndUpdate({ _id: id, userId }, payload, { new: true });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async removeCategory(userId: string, id: string) {
    await TaskCategoryModel.deleteOne({ _id: id, userId });
    await TodosModel.updateMany({ userId, categoryId: id }, { $unset: { categoryId: '' } });
  }

  static async listDependencies(userId: string, taskId: string) {
    const task = await TodosModel.findOne({ _id: taskId, userId }).lean();
    if (!task) throw new NotFoundError('Task not found');
    return TaskDependencyModel.find({ taskId }).sort({ createdAt: -1 });
  }

  static async addDependency(userId: string, payload: { taskId: string; dependsOnTaskId: string }) {
    const [task, depends] = await Promise.all([
      TodosModel.findOne({ _id: payload.taskId, userId }),
      TodosModel.findOne({ _id: payload.dependsOnTaskId, userId }),
    ]);
    if (!task || !depends) throw new NotFoundError('Task not found');
    return TaskDependencyModel.create(payload);
  }

  static async removeDependency(userId: string, taskId: string, dependsOnTaskId: string) {
    const task = await TodosModel.findOne({ _id: taskId, userId });
    if (!task) throw new NotFoundError('Task not found');
    await TaskDependencyModel.deleteOne({ taskId, dependsOnTaskId });
  }

  static async recordProgress(
    userId: string,
    payload: {
      todoId?: string;
      activityType: string;
      durationSeconds?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return ProgressRecorderModel.create({
      userId,
      ...payload,
    });
  }

  static async listProgress(userId: string) {
    return ProgressRecorderModel.find({ userId }).sort({ createdAt: -1 }).limit(100);
  }

  static async listCalendarEvents(userId: string) {
    return CalendarEventModel.find({ userId }).sort({ startTime: 1 });
  }

  static async createCalendarEvent(
    userId: string,
    payload: {
      title: string;
      description?: string;
      location?: string;
      startTime: string;
      endTime: string;
      isAllDay?: boolean;
      recurrencePattern?: Record<string, unknown>;
      reminderTime?: number;
      color?: string;
    },
  ) {
    return CalendarEventModel.create({
      userId,
      ...payload,
      startTime: new Date(payload.startTime),
      endTime: new Date(payload.endTime),
      isAllDay: payload.isAllDay ?? false,
    });
  }

  static async updateCalendarEvent(
    userId: string,
    id: string,
    payload: {
      title?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      isAllDay?: boolean;
      recurrencePattern?: Record<string, unknown>;
      reminderTime?: number;
      color?: string;
    },
  ) {
    const event = await CalendarEventModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...payload,
        startTime: payload.startTime ? new Date(payload.startTime) : undefined,
        endTime: payload.endTime ? new Date(payload.endTime) : undefined,
      },
      { new: true },
    );
    if (!event) throw new NotFoundError('Event not found');
    return event;
  }

  static async removeCalendarEvent(userId: string, id: string) {
    await CalendarEventModel.deleteOne({ _id: id, userId });
  }

  static async listNotebooks(userId: string) {
    return NotebookModel.find({ userId }).sort({ updatedAt: -1 });
  }

  static async createNotebook(
    userId: string,
    payload: { name: string; description?: string; parentNotebookId?: string; color?: string; icon?: string },
  ) {
    return NotebookModel.create({ userId, ...payload });
  }

  static async updateNotebook(
    userId: string,
    id: string,
    payload: { name?: string; description?: string; parentNotebookId?: string; color?: string; icon?: string },
  ) {
    const notebook = await NotebookModel.findOneAndUpdate({ _id: id, userId }, payload, { new: true });
    if (!notebook) throw new NotFoundError('Notebook not found');
    return notebook;
  }

  static async removeNotebook(userId: string, id: string) {
    await NotebookModel.deleteOne({ _id: id, userId });
    await NoteModel.updateMany({ userId, notebookId: id }, { $unset: { notebookId: '' } });
  }

  static async listNotes(userId: string, notebookId?: string) {
    const query: Record<string, unknown> = { userId };
    if (notebookId) query.notebookId = notebookId;
    return NoteModel.find(query).sort({ updatedAt: -1 });
  }

  static async createNote(
    userId: string,
    payload: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isArchived?: boolean;
      color?: string;
      notebookId?: string;
    },
  ) {
    const wordCount = payload.content ? payload.content.trim().split(/\s+/).length : 0;
    const preview = payload.content?.slice(0, 160);
    const note = await NoteModel.create({
      userId,
      ...payload,
      wordCount,
      preview,
      isPinned: payload.isPinned ?? false,
      isArchived: payload.isArchived ?? false,
    });

    if (payload.content) {
      await NoteVersionModel.create({
        noteId: note.id,
        content: payload.content,
        versionNumber: 1,
        createdBy: userId,
      });
    }

    return note;
  }

  static async updateNote(
    userId: string,
    id: string,
    payload: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isArchived?: boolean;
      color?: string;
      notebookId?: string;
    },
  ) {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) throw new NotFoundError('Note not found');

    if (typeof payload.content === 'string' && payload.content !== note.content) {
      const currentVersionCount = await NoteVersionModel.countDocuments({ noteId: note.id });
      await NoteVersionModel.create({
        noteId: note.id,
        content: payload.content,
        versionNumber: currentVersionCount + 1,
        createdBy: userId,
      });
      note.wordCount = payload.content.trim() ? payload.content.trim().split(/\s+/).length : 0;
      note.preview = payload.content.slice(0, 160);
    }

    Object.assign(note, payload);
    await note.save();
    return note;
  }

  static async removeNote(userId: string, id: string) {
    await NoteModel.deleteOne({ _id: id, userId });
    await NoteVersionModel.deleteMany({ noteId: id });
  }

  static async listNoteVersions(userId: string, noteId: string) {
    const note = await NoteModel.findOne({ _id: noteId, userId });
    if (!note) throw new NotFoundError('Note not found');
    return NoteVersionModel.find({ noteId }).sort({ versionNumber: -1 });
  }

  static async listTimeEntries(userId: string) {
    return TimeEntryModel.find({ userId }).sort({ startTime: -1 });
  }

  static async createTimeEntry(
    userId: string,
    payload: { taskId?: string; description?: string; startTime: string; endTime?: string; isManual?: boolean },
  ) {
    const startTime = new Date(payload.startTime);
    const endTime = payload.endTime ? new Date(payload.endTime) : undefined;
    const duration = endTime ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000)) : undefined;
    return TimeEntryModel.create({
      userId,
      taskId: payload.taskId,
      description: payload.description,
      startTime,
      endTime,
      duration,
      isManual: payload.isManual ?? false,
    });
  }

  static async updateTimeEntry(userId: string, id: string, payload: { description?: string; endTime?: string }) {
    const entry = await TimeEntryModel.findOne({ _id: id, userId });
    if (!entry) throw new NotFoundError('Time entry not found');

    if (payload.description !== undefined) entry.description = payload.description;
    if (payload.endTime) {
      entry.endTime = new Date(payload.endTime);
      entry.duration = Math.max(0, Math.round((entry.endTime.getTime() - entry.startTime.getTime()) / 1000));
    }

    await entry.save();
    return entry;
  }

  static async removeTimeEntry(userId: string, id: string) {
    await TimeEntryModel.deleteOne({ _id: id, userId });
  }

  static async listPomodoroSessions(userId: string) {
    return PomodoroSessionModel.find({ userId }).sort({ startedAt: -1 }).limit(200);
  }

  static async createPomodoro(
    userId: string,
    payload: { taskId?: string; sessionType: 'focus' | 'short_break' | 'long_break'; duration: number; startedAt?: string },
  ) {
    return PomodoroSessionModel.create({
      userId,
      taskId: payload.taskId,
      sessionType: payload.sessionType,
      duration: payload.duration,
      startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
      isCompleted: false,
    });
  }

  static async completePomodoro(userId: string, id: string, payload: { completedDuration?: number }) {
    const session = await PomodoroSessionModel.findOne({ _id: id, userId });
    if (!session) throw new NotFoundError('Pomodoro session not found');

    session.isCompleted = true;
    session.completedAt = new Date();
    session.completedDuration = payload.completedDuration ?? session.duration;
    await session.save();
    return session;
  }

  static async listFocusGoals(userId: string) {
    return FocusGoalModel.find({ userId }).sort({ endDate: 1 });
  }

  static async createFocusGoal(
    userId: string,
    payload: { name: string; targetHours: number; period: 'daily' | 'weekly' | 'monthly'; startDate: string; endDate: string },
  ) {
    return FocusGoalModel.create({
      userId,
      ...payload,
      progressHours: 0,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    });
  }

  static async updateFocusGoal(
    userId: string,
    id: string,
    payload: {
      name?: string;
      targetHours?: number;
      period?: 'daily' | 'weekly' | 'monthly';
      progressHours?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const goal = await FocusGoalModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      },
      { new: true },
    );
    if (!goal) throw new NotFoundError('Focus goal not found');
    return goal;
  }

  static async removeFocusGoal(userId: string, id: string) {
    await FocusGoalModel.deleteOne({ _id: id, userId });
  }
}
