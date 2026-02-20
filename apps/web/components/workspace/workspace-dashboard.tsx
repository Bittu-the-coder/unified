'use client';

import Link from 'next/link';
import { MessagingWorkspace } from '@/components/messaging/messaging-workspace';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  authApi,
  messagingApi,
  productivityApi,
  userApi,
  type AuthSession,
  type CalendarEvent,
  type ChatMessage,
  type Conversation,
  type FocusGoal,
  type Note,
  type Notebook,
  type NoteVersion,
  type PomodoroSession,
  type ProgressRecord,
  type TaskCategory,
  type TaskDependency,
  type TimeEntry,
  type Todo,
  type UserProfile,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { comingSoonCopy, serviceMenu, type ServiceKey } from './config';
import { useEffect, useMemo, useState } from 'react';

const isServiceKey = (value: string): value is ServiceKey => {
  return serviceMenu.some((item) => item.key === value);
};

export function WorkspaceDashboard({ section = 'overview' }: { section?: string }) {
  const selected: ServiceKey = isServiceKey(section) ? section : 'overview';
  const [user, setUser] = useState<{ id: string; email: string; username: string; fullName: string; uniqueNumber?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [socialStats, setSocialStats] = useState<{ followers: number; following: number; blocked: number } | null>(null);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [publicProfileId, setPublicProfileId] = useState('');
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', username: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteVersions, setNoteVersions] = useState<NoteVersion[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [focusGoals, setFocusGoals] = useState<FocusGoal[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [conversationParticipantIds, setConversationParticipantIds] = useState('');
  const [messageText, setMessageText] = useState('');

  const [todoTitle, setTodoTitle] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [notebookName, setNotebookName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState('');
  const [todoDependencyTaskId, setTodoDependencyTaskId] = useState('');
  const [todoDependsOnTaskId, setTodoDependsOnTaskId] = useState('');
  const [progressTodoId, setProgressTodoId] = useState('');
  const [progressType, setProgressType] = useState('focus');
  const [goalName, setGoalName] = useState('');

  const stats = useMemo(
    () => [
      { label: 'Productivity APIs', value: '8 feature sets' },
      { label: 'Active Todos', value: String(todos.length) },
      { label: 'Notes', value: String(notes.length) },
      { label: 'Calendar Events', value: String(events.length) },
    ],
    [todos.length, notes.length, events.length],
  );

  const loadProductivityData = async () => {
    const [todoRes, categoryRes, progressRes, eventRes, notebookRes, noteRes, timeRes, pomodoroRes, goalRes] =
      await Promise.all([
        productivityApi.listTodos(),
        productivityApi.listCategories(),
        productivityApi.listProgress(),
        productivityApi.listCalendarEvents(),
        productivityApi.listNotebooks(),
        productivityApi.listNotes(selectedNotebookId || undefined),
        productivityApi.listTimeEntries(),
        productivityApi.listPomodoroSessions(),
        productivityApi.listFocusGoals(),
    ]);

    setTodos(todoRes);
    setCategories(categoryRes);
    setProgressRecords(progressRes);
    setEvents(eventRes);
    setNotebooks(notebookRes);
    setNotes(noteRes);
    setTimeEntries(timeRes);
    setPomodoroSessions(pomodoroRes);
    setFocusGoals(goalRes);

    if (todoDependencyTaskId) {
      const deps = await productivityApi.listDependencies(todoDependencyTaskId);
      setDependencies(deps);
    } else {
      setDependencies([]);
    }
  };

  const loadMessagingData = async () => {
    const conversationList = await messagingApi.listConversations();
    setConversations(conversationList);

    const activeConversationId = selectedConversationId || conversationList[0]?._id || '';
    if (!activeConversationId) {
      setSelectedConversationId('');
      setMessages([]);
      return;
    }

    setSelectedConversationId(activeConversationId);
    const messageList = await messagingApi.listMessages(activeConversationId);
    setMessages(messageList);
  };

  const loadIdentityData = async () => {
    const me = await authApi.me();
    setUser({ id: me.id, email: me.email, username: me.username, fullName: me.fullName, uniqueNumber: me.uniqueNumber });
    setProfileForm({
      fullName: me.fullName?.trim() || '',
      username: me.username?.trim() || '',
    });

    const [myProfile, mySessions, stats, followerUsers, followingUsers, blocked] = await Promise.allSettled([
      userApi.me(),
      authApi.sessions(),
      userApi.stats(),
      userApi.followers(),
      userApi.following(),
      userApi.blocked(),
    ]);

    if (myProfile.status === 'fulfilled') {
      setProfile(myProfile.value);
      const profileFullName = myProfile.value.fullName?.trim() || '';
      const profileUsername = myProfile.value.username?.trim() || '';
      const authFullName = me.fullName?.trim() || '';
      const authUsername = me.username?.trim() || '';

      // Always trust auth identity first. User profile may still hold seeded defaults ("New User", email-local username).
      setProfileForm({
        fullName: authFullName || (profileFullName && profileFullName !== 'New User' ? profileFullName : ''),
        username: authUsername || profileUsername,
      });
    }
    if (mySessions.status === 'fulfilled') {
      setSessions(mySessions.value);
    } else {
      setSessions([]);
    }
    if (stats.status === 'fulfilled') {
      setSocialStats(stats.value);
    } else {
      setSocialStats(null);
    }
    if (followerUsers.status === 'fulfilled') {
      setFollowers(followerUsers.value);
    } else {
      setFollowers([]);
    }
    if (followingUsers.status === 'fulfilled') {
      setFollowing(followingUsers.value);
    } else {
      setFollowing([]);
    }
    if (blocked.status === 'fulfilled') {
      setBlockedUsers(blocked.value);
    } else {
      setBlockedUsers([]);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await loadIdentityData();
      await loadProductivityData();
      await loadMessagingData();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      if (message.toLowerCase().includes('session expired') || message.toLowerCase().includes('invalid access token')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void loadProductivityData().catch((err) => {
      const message = (err as Error).message;
      setError(message);
      if (message.toLowerCase().includes('session expired') || message.toLowerCase().includes('invalid access token')) {
        window.location.href = '/login';
      }
    });
  }, [selectedNotebookId, todoDependencyTaskId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void messagingApi
      .listMessages(selectedConversationId)
      .then((data) => setMessages(data))
      .catch((err) => setError((err as Error).message));
  }, [selectedConversationId]);

  useEffect(() => {
    if (!user) return;
    setProfileForm((prev) => ({
      fullName: prev.fullName || user.fullName || '',
      username: prev.username || user.username || '',
    }));
  }, [user]);

  const addTodo = async () => {
    if (!todoTitle.trim()) return;
    await productivityApi.createTodo({ title: todoTitle });
    setTodoTitle('');
    await loadProductivityData();
  };

  const toggleTodoStatus = async (todo: Todo) => {
    const nextStatus =
      todo.status === 'pending' ? 'in_progress' : todo.status === 'in_progress' ? 'completed' : 'pending';
    await productivityApi.updateTodo(todo._id, { status: nextStatus });
    await loadProductivityData();
  };

  const deleteTodo = async (id: string) => {
    await productivityApi.deleteTodo(id);
    await loadProductivityData();
  };

  const addCategory = async () => {
    if (!categoryName.trim()) return;
    await productivityApi.createCategory({ name: categoryName });
    setCategoryName('');
    await loadProductivityData();
  };

  const renameCategory = async (id: string, name: string) => {
    const nextName = window.prompt('Update category name', name)?.trim();
    if (!nextName) return;
    await productivityApi.updateCategory(id, { name: nextName });
    await loadProductivityData();
  };

  const deleteCategory = async (id: string) => {
    await productivityApi.deleteCategory(id);
    await loadProductivityData();
  };

  const addDependency = async () => {
    if (!todoDependencyTaskId || !todoDependsOnTaskId) return;
    await productivityApi.addDependency({ taskId: todoDependencyTaskId, dependsOnTaskId: todoDependsOnTaskId });
    setTodoDependsOnTaskId('');
    const deps = await productivityApi.listDependencies(todoDependencyTaskId);
    setDependencies(deps);
  };

  const removeDependency = async (taskId: string, dependsOnTaskId: string) => {
    await productivityApi.removeDependency(taskId, dependsOnTaskId);
    const deps = await productivityApi.listDependencies(taskId);
    setDependencies(deps);
  };

  const addProgressRecord = async () => {
    await productivityApi.createProgress({
      todoId: progressTodoId || undefined,
      activityType: progressType || 'focus',
      durationSeconds: 1500,
    });
    setProgressTodoId('');
    setProgressType('focus');
    await loadProductivityData();
  };

  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    const start = new Date();
    const end = new Date(Date.now() + 60 * 60 * 1000);
    await productivityApi.createCalendarEvent({ title: eventTitle, startTime: start.toISOString(), endTime: end.toISOString() });
    setEventTitle('');
    await loadProductivityData();
  };

  const renameEvent = async (id: string, title: string) => {
    const nextTitle = window.prompt('Update event title', title)?.trim();
    if (!nextTitle) return;
    await productivityApi.updateCalendarEvent(id, { title: nextTitle });
    await loadProductivityData();
  };

  const deleteEvent = async (id: string) => {
    await productivityApi.deleteCalendarEvent(id);
    await loadProductivityData();
  };

  const addNotebook = async () => {
    if (!notebookName.trim()) return;
    await productivityApi.createNotebook({ name: notebookName });
    setNotebookName('');
    await loadProductivityData();
  };

  const renameNotebook = async (id: string, name: string) => {
    const nextName = window.prompt('Update notebook name', name)?.trim();
    if (!nextName) return;
    await productivityApi.updateNotebook(id, { name: nextName });
    await loadProductivityData();
  };

  const deleteNotebook = async (id: string) => {
    await productivityApi.deleteNotebook(id);
    if (selectedNotebookId === id) {
      setSelectedNotebookId('');
    }
    await loadProductivityData();
  };

  const addNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    await productivityApi.createNote({
      title: noteTitle,
      content: noteContent,
      notebookId: selectedNotebookId || undefined,
    });
    setNoteTitle('');
    setNoteContent('');
    await loadProductivityData();
  };

  const updateNote = async (id: string, currentContent: string) => {
    const content = window.prompt('Update note content', currentContent ?? '');
    if (content === null) return;
    await productivityApi.updateNote(id, { content });
    await loadProductivityData();
  };

  const deleteNote = async (id: string) => {
    await productivityApi.deleteNote(id);
    if (selectedNoteId === id) {
      setSelectedNoteId('');
      setNoteVersions([]);
    }
    await loadProductivityData();
  };

  const loadNoteVersions = async (noteId: string) => {
    const versions = await productivityApi.listNoteVersions(noteId);
    setSelectedNoteId(noteId);
    setNoteVersions(versions);
  };

  const createQuickPomodoro = async () => {
    await productivityApi.createPomodoro({ sessionType: 'focus', duration: 1500 });
    await loadProductivityData();
  };

  const completePomodoro = async (id: string, duration: number) => {
    await productivityApi.completePomodoro(id, { completedDuration: duration });
    await loadProductivityData();
  };

  const createQuickTimeEntry = async () => {
    const start = new Date(Date.now() - 30 * 60 * 1000);
    const end = new Date();
    await productivityApi.createTimeEntry({
      description: 'Deep work session',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isManual: true,
    });
    await loadProductivityData();
  };

  const closeTimeEntry = async (entry: TimeEntry) => {
    await productivityApi.updateTimeEntry(entry._id, { endTime: new Date().toISOString() });
    await loadProductivityData();
  };

  const deleteTimeEntry = async (id: string) => {
    await productivityApi.deleteTimeEntry(id);
    await loadProductivityData();
  };

  const addGoal = async () => {
    if (!goalName.trim()) return;
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await productivityApi.createFocusGoal({
      name: goalName,
      targetHours: 10,
      period: 'weekly',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    setGoalName('');
    await loadProductivityData();
  };

  const incrementGoalProgress = async (goal: FocusGoal) => {
    await productivityApi.updateFocusGoal(goal._id, { progressHours: goal.progressHours + 1 });
    await loadProductivityData();
  };

  const deleteGoal = async (id: string) => {
    await productivityApi.deleteFocusGoal(id);
    await loadProductivityData();
  };

  const saveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      const updated = await userApi.updateMe({
        fullName: profileForm.fullName,
        username: profileForm.username,
      });
      setProfile(updated);
      setSuccess('Profile updated');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const savePassword = async () => {
    try {
      setError('');
      setSuccess('');
      await authApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSuccess('Password changed. Please login again.');
      await authApi.logout();
      window.location.href = '/login';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      setError('');
      const users = await userApi.search(userSearchQuery, 8);
      setUserSearchResults(users);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const followUser = async (id: string) => {
    try {
      await userApi.follow(id);
      await loadIdentityData();
      await searchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await authApi.revokeSession(id);
      await loadIdentityData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const unfollowUser = async (id: string) => {
    try {
      await userApi.unfollow(id);
      await loadIdentityData();
      await searchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const blockUser = async (id: string) => {
    try {
      await userApi.block(id);
      await loadIdentityData();
      await searchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const unblockUser = async (id: string) => {
    try {
      await userApi.unblock(id);
      await loadIdentityData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchPublicProfile = async () => {
    if (!publicProfileId.trim()) {
      setPublicProfile(null);
      return;
    }
    try {
      setError('');
      const profileData = await userApi.getByUniqueNumber(publicProfileId.trim());
      setPublicProfile(profileData);
    } catch (err) {
      setError((err as Error).message);
      setPublicProfile(null);
    }
  };

  const logoutAllDevices = async () => {
    try {
      await authApi.logoutAll();
      await authApi.logout();
      window.location.href = '/login';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createConversation = async () => {
    const participantIds = conversationParticipantIds
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!participantIds.length) return;

    await messagingApi.createConversation({
      title: conversationTitle.trim() || undefined,
      participantIds,
    });
    setConversationTitle('');
    setConversationParticipantIds('');
    await loadMessagingData();
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !messageText.trim()) return;
    await messagingApi.createMessage(selectedConversationId, { content: messageText.trim() });
    setMessageText('');
    const messageList = await messagingApi.listMessages(selectedConversationId);
    setMessages(messageList);
  };

  const editMessage = async (message: ChatMessage) => {
    const content = window.prompt('Edit message', message.content);
    if (content === null) return;
    await messagingApi.updateMessage(message._id, { content });
    const messageList = await messagingApi.listMessages(selectedConversationId);
    setMessages(messageList);
  };

  const deleteMessage = async (messageId: string) => {
    await messagingApi.deleteMessage(messageId);
    const messageList = await messagingApi.listMessages(selectedConversationId);
    setMessages(messageList);
  };

  const deleteConversation = async (conversationId: string) => {
    await messagingApi.deleteConversation(conversationId);
    if (selectedConversationId === conversationId) {
      setSelectedConversationId('');
      setMessages([]);
    }
    await loadMessagingData();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Snapshot</CardTitle>
          <CardDescription>Unified front-end experience across all planned services.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {serviceMenu
            .filter((s) => s.key !== 'overview')
            .map((service) => (
              <Link
                key={service.key}
                href={`/dashboard/${service.key}`}
                className="rounded-xl border border-border p-4 text-left transition hover:bg-muted"
              >
                <div className="mb-2 flex items-center gap-2">
                  <service.icon className="h-4 w-4 text-accent" />
                  <span className="font-medium">{service.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">Open module</p>
              </Link>
            ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderAuthUser = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Identity</CardTitle>
          <CardDescription>Connected to auth and user services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p>Loading user...</p> : <p>{user ? `${user.fullName} · @${user.username} (${user.email})${user.uniqueNumber ? ` · #${user.uniqueNumber}` : ''}` : 'Not authenticated'}</p>}
          {socialStats && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-3 text-sm">Followers: {socialStats.followers}</div>
              <div className="rounded-xl border border-border p-3 text-sm">Following: {socialStats.following}</div>
              <div className="rounded-xl border border-border p-3 text-sm">Blocked: {socialStats.blocked}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">JWT Auth</Badge>
            <Badge variant="outline">Session Management</Badge>
            <Badge variant="warning">Profile Management</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profile Editor UX</CardTitle>
          <CardDescription>Professional form behavior for user profile updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Full Name"
            value={profileForm.fullName || user?.fullName || ''}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            placeholder="Username"
            value={profileForm.username || user?.username || ''}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          <Button variant="secondary" onClick={saveProfile}>Save Profile</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password & Sessions</CardTitle>
          <CardDescription>Secure your account and manage active sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
          />
          <Input
            placeholder="New password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={savePassword}>Change Password</Button>
            <Button variant="ghost" onClick={logoutAllDevices}>Logout All Devices</Button>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session._id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{session.userAgent ?? 'Unknown device'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(session.updatedAt).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => revokeSession(session._id)}>Revoke</Button>
              </div>
            ))}
            {!sessions.length && <p className="text-sm text-muted-foreground">No active sessions.</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>User Discovery</CardTitle>
          <CardDescription>Search users and follow directly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, username or email"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <Button variant="outline" onClick={searchUsers}>Search</Button>
          </div>
          <div className="space-y-2">
            {userSearchResults.map((result) => (
              <div key={result.authUserId} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="font-medium">{result.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{result.username}</p>
                </div>
                <div className="flex gap-2">
                  {following.some((u) => u.authUserId === result.authUserId) ? (
                    <Button size="sm" variant="outline" onClick={() => unfollowUser(result.authUserId)}>
                      Unfollow
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => followUser(result.authUserId)}>
                      Follow
                    </Button>
                  )}
                  {blockedUsers.some((u) => u.authUserId === result.authUserId) ? (
                    <Button size="sm" variant="ghost" onClick={() => unblockUser(result.authUserId)}>
                      Unblock
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => blockUser(result.authUserId)}>
                      Block
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!userSearchResults.length && <p className="text-sm text-muted-foreground">No search results.</p>}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Followers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {followers.map((item) => (
              <div key={item.authUserId} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{item.fullName}</p>
                <p className="text-xs text-muted-foreground">@{item.username}</p>
              </div>
            ))}
            {!followers.length && <p className="text-sm text-muted-foreground">No followers yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Following</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {following.map((item) => (
              <div key={item.authUserId} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{item.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{item.username}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => unfollowUser(item.authUserId)}>Unfollow</Button>
              </div>
            ))}
            {!following.length && <p className="text-sm text-muted-foreground">No following users.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockedUsers.map((item) => (
              <div key={item.authUserId} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{item.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{item.username}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => unblockUser(item.authUserId)}>Unblock</Button>
              </div>
            ))}
            {!blockedUsers.length && <p className="text-sm text-muted-foreground">No blocked users.</p>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Public Profile Lookup</CardTitle>
          <CardDescription>Fetch any public user profile by unique user number.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter unique user number"
              value={publicProfileId}
              onChange={(e) => setPublicProfileId(e.target.value)}
            />
            <Button variant="outline" onClick={fetchPublicProfile}>Fetch</Button>
          </div>
          {publicProfile && (
            <div className="rounded-xl border border-border p-3">
              <p className="font-medium">{publicProfile.fullName}</p>
              <p className="text-sm text-muted-foreground">@{publicProfile.username}</p>
              {publicProfile.uniqueNumber ? (
                <p className="text-xs text-muted-foreground">#{publicProfile.uniqueNumber}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProductivity = () => (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Create and manage tasks with categories and priorities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Add task" value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} />
              <Button onClick={addTodo}>Add</Button>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {todos.map((todo) => (
                <div key={todo._id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-medium">{todo.title}</p>
                    <p className="text-xs text-muted-foreground">{todo.priority} · {todo.status.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleTodoStatus(todo)}>
                      Next
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTodo(todo._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {todos.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Categories</CardTitle>
            <CardDescription>Organize tasks by category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              <Button variant="secondary" onClick={addCategory}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <div key={c._id} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
                  <Badge variant="outline">{c.name}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => renameCategory(c._id, c.name)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategory(c._id)}>
                    Delete
                  </Button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Task Id" value={todoDependencyTaskId} onChange={(e) => setTodoDependencyTaskId(e.target.value)} />
            <div className="flex gap-2">
              <Input
                placeholder="Depends on Task Id"
                value={todoDependsOnTaskId}
                onChange={(e) => setTodoDependsOnTaskId(e.target.value)}
              />
              <Button variant="outline" onClick={addDependency}>Add</Button>
            </div>
            <div className="max-h-32 space-y-2 overflow-auto">
              {dependencies.map((d) => (
                <div key={d._id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                  <span>
                    {d.taskId} {'<-'} {d.dependsOnTaskId}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeDependency(d.taskId, d.dependsOnTaskId)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Todo Id (optional)" value={progressTodoId} onChange={(e) => setProgressTodoId(e.target.value)} />
            <Input placeholder="Activity Type" value={progressType} onChange={(e) => setProgressType(e.target.value)} />
            <Button variant="outline" onClick={addProgressRecord}>Record</Button>
            <div className="max-h-32 space-y-2 overflow-auto">
              {progressRecords.slice(0, 8).map((p) => (
                <div key={p._id} className="rounded-lg border border-border p-2 text-xs">
                  {p.activityType} · {new Date(p.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calendar Events</CardTitle>
            <CardDescription>Plan your schedule and reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Event title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <Button variant="secondary" onClick={addEvent}>Add</Button>
            </div>
            <div className="max-h-52 space-y-2 overflow-auto">
              {events.map((e) => (
                <div key={e._id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.startTime).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => renameEvent(e._id, e.title)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteEvent(e._id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notebooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Notebook name" value={notebookName} onChange={(e) => setNotebookName(e.target.value)} />
              <Button variant="secondary" onClick={addNotebook}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={selectedNotebookId ? 'outline' : 'default'} onClick={() => setSelectedNotebookId('')}>
                All
              </Button>
              {notebooks.map((notebook) => (
                <div key={notebook._id} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
                  <Button
                    size="sm"
                    variant={selectedNotebookId === notebook._id ? 'default' : 'ghost'}
                    onClick={() => setSelectedNotebookId(notebook._id)}
                  >
                    {notebook.name}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => renameNotebook(notebook._id, notebook.name)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteNotebook(notebook._id)}>Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Capture ideas with notebook support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
            <Textarea placeholder="Note content" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={addNote}>Save Note</Button>
              <Badge variant="outline">Notebooks: {notebooks.length}</Badge>
            </div>
            <div className="max-h-52 space-y-2 overflow-auto">
              {notes.map((n) => (
                <div key={n._id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{n.title ?? 'Untitled note'}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateNote(n._id, n.content ?? '')}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNote(n._id)}>Delete</Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{(n.content ?? '').slice(0, 90)}</p>
                  <Button size="sm" variant="ghost" onClick={() => loadNoteVersions(n._id)}>Versions</Button>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes.</p>}
            </div>
            {selectedNoteId && (
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-medium">Note versions</p>
                <div className="max-h-32 space-y-2 overflow-auto">
                  {noteVersions.map((v) => (
                    <div key={v._id} className="text-xs text-muted-foreground">
                      v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={createQuickTimeEntry}>Add 30-min Session</Button>
            <div className="max-h-40 space-y-2 overflow-auto">
              {timeEntries.map((entry) => (
                <div key={entry._id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                  <div>
                    <p>{entry.description ?? 'Time entry'}</p>
                    <p className="text-muted-foreground">{entry.duration ?? 0}s</p>
                  </div>
                  <div className="flex gap-2">
                    {!entry.endTime && <Button size="sm" variant="outline" onClick={() => closeTimeEntry(entry)}>Stop</Button>}
                    <Button size="sm" variant="ghost" onClick={() => deleteTimeEntry(entry._id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pomodoro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={createQuickPomodoro}>Start Focus (25m)</Button>
            <div className="max-h-40 space-y-2 overflow-auto">
              {pomodoroSessions.map((session) => (
                <div key={session._id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                  <p>{session.sessionType} · {session.duration}s</p>
                  {!session.isCompleted && (
                    <Button size="sm" variant="ghost" onClick={() => completePomodoro(session._id, session.duration)}>
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Focus Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Goal name" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
              <Button variant="secondary" onClick={addGoal}>Add</Button>
            </div>
            <div className="max-h-40 space-y-2 overflow-auto">
              {focusGoals.map((g) => (
                <div key={g._id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.progressHours}/{g.targetHours}h · {g.period}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => incrementGoalProgress(g)}>+1h</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGoal(g._id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {focusGoals.length === 0 && <p className="text-sm text-muted-foreground">No goals.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  const renderMessages = () => (
    <MessagingWorkspace
      currentUserId={user?.id ?? ''}
      onError={(message) => setError(message)}
    />
  );

  const renderComingSoon = (key: Exclude<ServiceKey, 'overview' | 'auth-user' | 'productivity'>) => (
    <Card>
      <CardHeader>
        <CardTitle>{serviceMenu.find((s) => s.key === key)?.title}</CardTitle>
        <CardDescription>Frontend module designed and ready for service integration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {comingSoonCopy[key].map((item) => (
          <div key={item} className="rounded-xl border border-border p-3">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderMain = () => {
    if (selected === 'overview') return renderOverview();
    if (selected === 'auth-user') return renderAuthUser();
    if (selected === 'productivity') return renderProductivity();
    if (selected === 'messages') return renderMessages();
    return renderComingSoon(selected);
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 space-y-1">
          <h1 className="text-xl font-bold">Unified Workspace</h1>
          <p className="text-sm text-muted-foreground">All services in one premium interface.</p>
        </div>
        <div className="mb-4 flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await authApi.logout();
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
        </div>
        <nav className="space-y-1">
          {serviceMenu.map((item) => (
            <Link
              key={item.key}
              href={`/dashboard/${item.key}`}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                selected === item.key ? 'bg-primary text-white' : 'text-foreground hover:bg-muted',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{success}</p>}
        {renderMain()}
      </section>
    </div>
  );
}




