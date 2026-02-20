const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: { message?: string };
};

type AuthUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  uniqueNumber: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  _id: string;
  authUserId: string;
  uniqueNumber?: string;
  email?: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  _id: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type Todo = {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskCategory = { _id: string; name: string; color?: string; icon?: string };
export type TaskDependency = { _id: string; taskId: string; dependsOnTaskId: string };
export type ProgressRecord = {
  _id: string;
  todoId?: string;
  activityType: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
export type CalendarEvent = { _id: string; title: string; startTime: string; endTime: string; location?: string };
export type Notebook = { _id: string; name: string; description?: string };
export type Note = {
  _id: string;
  title?: string;
  content?: string;
  notebookId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  updatedAt: string;
};
export type NoteVersion = { _id: string; noteId: string; content: string; versionNumber: number; createdAt: string };
export type TimeEntry = { _id: string; description?: string; startTime: string; endTime?: string; duration?: number };
export type PomodoroSession = {
  _id: string;
  sessionType: 'focus' | 'short_break' | 'long_break';
  duration: number;
  isCompleted: boolean;
  completedDuration?: number;
};
export type FocusGoal = {
  _id: string;
  name: string;
  targetHours: number;
  progressHours: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
};

export type CloudFile = {
  _id: string;
  userId: string;
  name: string;
  originalName: string;
  description?: string;
  fileType: string;
  mimeType?: string;
  size: number;
  storageProvider: 'imagekit' | 'cloudinary';
  providerFileId?: string;
  providerResourceType?: 'image' | 'video' | 'raw';
  storagePath: string;
  publicUrl: string;
  thumbnailUrl?: string;
  hash?: string;
  isPublic: boolean;
  isStarred: boolean;
  version: number;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudFolder = {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  isStarred: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CloudQuota = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
};

export type Conversation = {
  _id: string;
  type: 'direct' | 'group';
  createdBy: string;
  dmKey?: string;
  title?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
  adminIds: string[];
  lastMessageId?: string;
  lastMessageAt?: string;
  updatedAt: string;
  memberState?: {
    isMuted: boolean;
    isPinned: boolean;
    isArchived: boolean;
    lastReadMessageId?: string;
    lastReadAt?: string;
    typing: boolean;
  } | null;
};

export type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'system' | 'image' | 'video' | 'audio' | 'file';
  replyToMessageId?: string;
  attachments: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name?: string; size?: number; mimeType?: string }>;
  deliveredTo: string[];
  readBy: string[];
  reactions: Array<{ emoji: string; userIds: string[] }>;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const authTokenStore = {
  getAccessToken: () => (typeof window === 'undefined' ? null : localStorage.getItem('accessToken')),
  getRefreshToken: () => (typeof window === 'undefined' ? null : localStorage.getItem('refreshToken')),
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

const parseEnvelope = async <T>(res: Response): Promise<ApiEnvelope<T>> => {
  try {
    return (await res.json()) as ApiEnvelope<T>;
  } catch {
    return { success: false, data: null as T, error: { message: 'Invalid JSON response' } };
  }
};

const refreshAccessToken = async () => {
  const refreshToken = authTokenStore.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await parseEnvelope<{ accessToken: string; refreshToken: string }>(res);
  if (!res.ok || !json.success) {
    authTokenStore.clear();
    return false;
  }

  authTokenStore.setTokens(json.data.accessToken, json.data.refreshToken);
  return true;
};

export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const isPublicAuthPath =
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/check-availability' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/auth/refresh';

  const call = async () => {
    const token = authTokenStore.getAccessToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    const json = await parseEnvelope<T>(response);
    return { response, json };
  };

  let { response, json } = await call();
  if (response.status === 401 && !isPublicAuthPath) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      ({ response, json } = await call());
    } else {
      authTokenStore.clear();
    }
  }

  if (!response.ok || !json.success) {
    const message =
      response.status === 401 && !isPublicAuthPath
        ? 'Session expired. Please login again.'
        : json?.error?.message ?? 'Request failed';
    throw new ApiError(message, response.status, json?.error?.message);
  }

  return json.data;
};

export const authApi = {
  register: (payload: { email: string; username: string; fullName: string; password: string }) =>
    apiFetch<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<{ user: AuthUser; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkAvailability: (payload: { email?: string; username?: string }) =>
    apiFetch<{ emailAvailable?: boolean; usernameAvailable?: boolean }>('/auth/check-availability', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email: string) =>
    apiFetch<{ resetToken: string | null }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload: { resetToken: string; newPassword: string }) =>
    apiFetch<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => apiFetch<AuthUser>('/auth/me'),
  sessions: () => apiFetch<AuthSession[]>('/auth/sessions'),
  revokeSession: (sessionId: string) =>
    apiFetch<null>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiFetch<null>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logoutAll: () =>
    apiFetch<null>('/auth/logout-all', {
      method: 'POST',
    }),
  logout: async () => {
    const refreshToken = authTokenStore.getRefreshToken();
    if (refreshToken) {
      await apiFetch<null>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    authTokenStore.clear();
  },
};

export const userApi = {
  me: () => apiFetch<UserProfile>('/users/me'),
  getById: (userId: string) => apiFetch<UserProfile>(`/users/${userId}`),
  getByUniqueNumber: (uniqueNumber: string) =>
    apiFetch<UserProfile>(`/users/by-number/${encodeURIComponent(uniqueNumber)}`),
  updateMe: (payload: Partial<Pick<UserProfile, 'email' | 'username' | 'fullName' | 'bio' | 'avatarUrl' | 'preferences'>>) =>
    apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  search: (q: string, limit = 10) => apiFetch<UserProfile[]>(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  followers: () => apiFetch<UserProfile[]>('/users/me/followers'),
  following: () => apiFetch<UserProfile[]>('/users/me/following'),
  blocked: () => apiFetch<UserProfile[]>('/users/me/blocked'),
  stats: () => apiFetch<{ followers: number; following: number; blocked: number }>('/users/me/stats'),
  follow: (userId: string) => apiFetch<{ followerId: string; followingId: string }>(`/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId: string) => apiFetch<null>(`/users/${userId}/follow`, { method: 'DELETE' }),
  block: (userId: string) => apiFetch<null>(`/users/${userId}/block`, { method: 'POST' }),
  unblock: (userId: string) => apiFetch<null>(`/users/${userId}/block`, { method: 'DELETE' }),
};

export const productivityApi = {
  listTodos: () => apiFetch<Todo[]>('/productivity/todos'),
  createTodo: (payload: Partial<Todo> & { title: string }) =>
    apiFetch<Todo>('/productivity/todos', { method: 'POST', body: JSON.stringify(payload) }),
  updateTodo: (id: string, payload: Partial<Todo>) =>
    apiFetch<Todo>(`/productivity/todos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTodo: (id: string) => apiFetch<null>(`/productivity/todos/${id}`, { method: 'DELETE' }),

  listCategories: () => apiFetch<TaskCategory[]>('/productivity/task-categories'),
  createCategory: (payload: { name: string; color?: string; icon?: string }) =>
    apiFetch<TaskCategory>('/productivity/task-categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: Partial<{ name: string; color: string; icon: string }>) =>
    apiFetch<TaskCategory>(`/productivity/task-categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) => apiFetch<null>(`/productivity/task-categories/${id}`, { method: 'DELETE' }),

  listDependencies: (taskId: string) => apiFetch<TaskDependency[]>(`/productivity/task-dependencies/${taskId}`),
  addDependency: (payload: { taskId: string; dependsOnTaskId: string }) =>
    apiFetch<TaskDependency>('/productivity/task-dependencies', { method: 'POST', body: JSON.stringify(payload) }),
  removeDependency: (taskId: string, dependsOnTaskId: string) =>
    apiFetch<null>(`/productivity/task-dependencies/${taskId}/${dependsOnTaskId}`, { method: 'DELETE' }),

  listProgress: () => apiFetch<ProgressRecord[]>('/productivity/progress'),
  createProgress: (payload: { todoId?: string; activityType: string; durationSeconds?: number; metadata?: Record<string, unknown> }) =>
    apiFetch<ProgressRecord>('/productivity/progress', { method: 'POST', body: JSON.stringify(payload) }),

  listCalendarEvents: () => apiFetch<CalendarEvent[]>('/productivity/calendar-events'),
  createCalendarEvent: (payload: { title: string; startTime: string; endTime: string; description?: string; location?: string }) =>
    apiFetch<CalendarEvent>('/productivity/calendar-events', { method: 'POST', body: JSON.stringify(payload) }),
  updateCalendarEvent: (id: string, payload: Partial<{ title: string; startTime: string; endTime: string; description: string; location: string }>) =>
    apiFetch<CalendarEvent>(`/productivity/calendar-events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCalendarEvent: (id: string) => apiFetch<null>(`/productivity/calendar-events/${id}`, { method: 'DELETE' }),

  listNotebooks: () => apiFetch<Notebook[]>('/productivity/notebooks'),
  createNotebook: (payload: { name: string; description?: string }) =>
    apiFetch<Notebook>('/productivity/notebooks', { method: 'POST', body: JSON.stringify(payload) }),
  updateNotebook: (id: string, payload: Partial<{ name: string; description: string }>) =>
    apiFetch<Notebook>(`/productivity/notebooks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteNotebook: (id: string) => apiFetch<null>(`/productivity/notebooks/${id}`, { method: 'DELETE' }),

  listNotes: (notebookId?: string) =>
    apiFetch<Note[]>(`/productivity/notes${notebookId ? `?notebookId=${encodeURIComponent(notebookId)}` : ''}`),
  createNote: (payload: { title?: string; content?: string; notebookId?: string; isPinned?: boolean; isArchived?: boolean }) =>
    apiFetch<Note>('/productivity/notes', { method: 'POST', body: JSON.stringify(payload) }),
  updateNote: (id: string, payload: Partial<{ title: string; content: string; notebookId: string; isPinned: boolean; isArchived: boolean }>) =>
    apiFetch<Note>(`/productivity/notes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteNote: (id: string) => apiFetch<null>(`/productivity/notes/${id}`, { method: 'DELETE' }),
  listNoteVersions: (noteId: string) => apiFetch<NoteVersion[]>(`/productivity/notes/${noteId}/versions`),

  listTimeEntries: () => apiFetch<TimeEntry[]>('/productivity/time-entries'),
  createTimeEntry: (payload: { description?: string; startTime: string; endTime?: string; isManual?: boolean; taskId?: string }) =>
    apiFetch<TimeEntry>('/productivity/time-entries', { method: 'POST', body: JSON.stringify(payload) }),
  updateTimeEntry: (id: string, payload: Partial<{ description: string; endTime: string }>) =>
    apiFetch<TimeEntry>(`/productivity/time-entries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTimeEntry: (id: string) => apiFetch<null>(`/productivity/time-entries/${id}`, { method: 'DELETE' }),

  listPomodoroSessions: () => apiFetch<PomodoroSession[]>('/productivity/pomodoro-sessions'),
  createPomodoro: (payload: { sessionType: 'focus' | 'short_break' | 'long_break'; duration: number; taskId?: string; startedAt?: string }) =>
    apiFetch<PomodoroSession>('/productivity/pomodoro-sessions', { method: 'POST', body: JSON.stringify(payload) }),
  completePomodoro: (id: string, payload: { completedDuration?: number }) =>
    apiFetch<PomodoroSession>(`/productivity/pomodoro-sessions/${id}/complete`, { method: 'PATCH', body: JSON.stringify(payload) }),

  listFocusGoals: () => apiFetch<FocusGoal[]>('/productivity/focus-goals'),
  createFocusGoal: (payload: { name: string; targetHours: number; period: 'daily' | 'weekly' | 'monthly'; startDate: string; endDate: string }) =>
    apiFetch<FocusGoal>('/productivity/focus-goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateFocusGoal: (id: string, payload: Partial<{ name: string; targetHours: number; period: 'daily' | 'weekly' | 'monthly'; progressHours: number; startDate: string; endDate: string }>) =>
    apiFetch<FocusGoal>(`/productivity/focus-goals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteFocusGoal: (id: string) => apiFetch<null>(`/productivity/focus-goals/${id}`, { method: 'DELETE' }),
};

export const messagingApi = {
  listConversations: () => apiFetch<Conversation[]>('/messaging/conversations'),
  getConversation: (id: string) => apiFetch<Conversation & { memberStates: unknown[]; lastMessage: ChatMessage | null }>(`/messaging/conversations/${id}`),
  createConversation: (payload: { title?: string; participantIds: string[] }) =>
    apiFetch<Conversation>('/messaging/conversations/group', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createDirectConversation: (payload: { participantId: string }) =>
    apiFetch<Conversation>('/messaging/conversations/direct', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createGroupConversation: (payload: { title?: string; description?: string; avatarUrl?: string; participantIds: string[] }) =>
    apiFetch<Conversation>('/messaging/conversations/group', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateConversation: (id: string, payload: { title?: string; description?: string; avatarUrl?: string }) =>
    apiFetch<Conversation>(`/messaging/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteConversation: (id: string) =>
    apiFetch<null>(`/messaging/conversations/${id}`, {
      method: 'DELETE',
    }),
  listMessages: (conversationId: string) =>
    apiFetch<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`),
  createMessage: (
    conversationId: string,
    payload: {
      content?: string;
      messageType?: 'text' | 'system' | 'image' | 'video' | 'audio' | 'file';
      replyToMessageId?: string;
      attachments?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name?: string; size?: number; mimeType?: string }>;
    },
  ) =>
    apiFetch<ChatMessage>(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMessage: (messageId: string, payload: { content: string }) =>
    apiFetch<ChatMessage>(`/messaging/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteMessage: (messageId: string) =>
    apiFetch<null>(`/messaging/messages/${messageId}`, {
      method: 'DELETE',
    }),
  addParticipant: (conversationId: string, participantId: string) =>
    apiFetch<Conversation>(`/messaging/conversations/${conversationId}/participants/add`, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),
  removeParticipant: (conversationId: string, participantId: string) =>
    apiFetch<Conversation>(`/messaging/conversations/${conversationId}/participants/remove`, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),
  makeAdmin: (conversationId: string, participantId: string) =>
    apiFetch<Conversation>(`/messaging/conversations/${conversationId}/participants/make-admin`, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),
  setMuted: (conversationId: string, value: boolean) =>
    apiFetch<unknown>(`/messaging/conversations/${conversationId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
  setPinned: (conversationId: string, value: boolean) =>
    apiFetch<unknown>(`/messaging/conversations/${conversationId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
  setArchived: (conversationId: string, value: boolean) =>
    apiFetch<unknown>(`/messaging/conversations/${conversationId}/archive`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
  setTyping: (conversationId: string, isTyping: boolean) =>
    apiFetch<unknown>(`/messaging/conversations/${conversationId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ isTyping }),
    }),
  markRead: (conversationId: string, messageId?: string) =>
    apiFetch<unknown>(`/messaging/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    }),
  addReaction: (messageId: string, emoji: string) =>
    apiFetch<ChatMessage>(`/messaging/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
  removeReaction: (messageId: string, emoji: string) =>
    apiFetch<ChatMessage>(`/messaging/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    }),
};

export const fileCloudApi = {
  quota: () => apiFetch<CloudQuota>('/file-cloud/quota'),
  listFiles: (params?: { folderId?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.folderId) query.set('folderId', params.folderId);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<CloudFile[]>(`/file-cloud/files${suffix}`);
  },
  createUploadSignature: (payload: { provider?: 'imagekit' | 'cloudinary'; fileName: string; folder?: string }) =>
    apiFetch<{
      provider: 'imagekit' | 'cloudinary';
      uploadUrl: string;
      params: Record<string, string | number | boolean>;
    }>('/file-cloud/upload/signature', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createFile: (payload: {
    name: string;
    originalName: string;
    description?: string;
    fileType: string;
    mimeType?: string;
    size: number;
    storageProvider: 'imagekit' | 'cloudinary';
    providerFileId?: string;
    providerResourceType?: 'image' | 'video' | 'raw';
    storagePath: string;
    publicUrl: string;
    thumbnailUrl?: string;
    hash?: string;
    parentFolderId?: string;
    isPublic?: boolean;
  }) =>
    apiFetch<CloudFile>('/file-cloud/files', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteFile: (fileId: string) =>
    apiFetch<null>(`/file-cloud/files/${fileId}`, {
      method: 'DELETE',
    }),
  updateFile: (
    fileId: string,
    payload: { name?: string; description?: string; parentFolderId?: string | null; isPublic?: boolean; isStarred?: boolean },
  ) =>
    apiFetch<CloudFile>(`/file-cloud/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listFolders: (parentFolderId?: string) =>
    apiFetch<CloudFolder[]>(`/file-cloud/folders${parentFolderId ? `?parentFolderId=${encodeURIComponent(parentFolderId)}` : ''}`),
  getFolder: (folderId: string) => apiFetch<CloudFolder>(`/file-cloud/folders/${folderId}`),
  createFolder: (payload: { name: string; description?: string; parentFolderId?: string }) =>
    apiFetch<CloudFolder>('/file-cloud/folders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateFolder: (folderId: string, payload: { name?: string; description?: string; parentFolderId?: string | null }) =>
    apiFetch<CloudFolder>(`/file-cloud/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteFolder: (folderId: string) =>
    apiFetch<null>(`/file-cloud/folders/${folderId}`, {
      method: 'DELETE',
    }),
};
