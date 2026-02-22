'use client';

import { FileCloudWorkspace } from '@/components/file-cloud/file-cloud-workspace';
import { MessagingWorkspace } from '@/components/messaging/messaging-workspace';
import { ProductivityWorkspace } from '@/components/productivity/productivity-workspace';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { comingSoonCopy, serviceMenu, type ServiceKey } from './config';
import { FontSwitcher } from './font-switcher';

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

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search by name, username or email"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <Button variant="outline" onClick={searchUsers} className="w-full sm:w-auto">Search</Button>
          </div>
          <div className="space-y-2">
            {userSearchResults.map((result) => (
              <div key={result.authUserId} className="rounded-xl border border-border p-3">
                <div className="mb-2">
                  <p className="font-medium">{result.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{result.username}</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
              <div key={item.authUserId} className="rounded-xl border border-border p-3 text-sm">
                <div className="mb-2">
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
              <div key={item.authUserId} className="rounded-xl border border-border p-3 text-sm">
                <div className="mb-2">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Enter unique user number"
              value={publicProfileId}
              onChange={(e) => setPublicProfileId(e.target.value)}
            />
            <Button variant="outline" onClick={fetchPublicProfile} className="w-full sm:w-auto">Fetch</Button>
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
    <ProductivityWorkspace
      onError={(message) => setError(message)}
      onSuccess={(message) => setSuccess(message)}
    />
  );

  const renderMessages = () => (
    <MessagingWorkspace
      currentUserId={user?.id ?? ''}
      onError={(message) => setError(message)}
    />
  );

  const renderFileCloud = () => (
    <FileCloudWorkspace
      onError={(message) => setError(message)}
      onSuccess={(message) => setSuccess(message)}
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
    if (selected === 'files') return renderFileCloud();
    return renderComingSoon(selected);
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-[260px] flex-col border border-border/50 bg-surface/95 backdrop-blur-2xl transition-all lg:flex shadow-2xl shadow-primary/5 rounded-[24px] py-4">
        <div className="flex h-[72px] shrink-0 items-center px-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm border border-border">
              <img src="/icon.svg" alt="Unified" className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Unified</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 px-4 overflow-y-auto scrollbar-hide">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-2">Workspace Services</p>
          {serviceMenu.map((item) => {
            const isActive = selected === item.key;
            return (
              <Link
                key={item.key}
                href={`/dashboard/${item.key}`}
                title={item.title}
                className={cn(
                  'group relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 outline-none',
                  isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface border border-transparent hover:text-foreground hover:shadow-sm',
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -mt-3.5 h-7 w-1 rounded-r-full bg-primary" />
                )}
                <div className={cn("p-1.5 rounded-lg transition-colors border", isActive ? "bg-primary/20 border-primary/30" : "bg-transparent border-transparent group-hover:bg-muted/50 group-hover:border-border/50")}>
                  <item.icon className={cn('h-4 w-4 transition-transform duration-300', isActive ? 'scale-110 text-accent' : 'scale-100 group-hover:scale-110')} />
                </div>
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-[292px] w-full min-w-0">
        {/* Top bar */}
        <header className="sticky top-4 z-30 mx-3 lg:mx-6 flex h-[72px] shrink-0 items-center justify-between border border-border/50 bg-surface/95 px-4 backdrop-blur-2xl md:px-6 shadow-sm transition-all rounded-[24px] mb-6">
          <div className="flex items-center lg:hidden flex-1">
             <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
                <img src="/icon.svg" alt="Unified" className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Unified</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center flex-1">
             <h2 className="text-xl font-bold text-foreground capitalize flex items-center gap-3 animate-fade-in">
                {serviceMenu.find(s => s.key === selected)?.icon && (
                  <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl shadow-inner">
                   {(() => { const Icon = serviceMenu.find(s => s.key === selected)?.icon as any; return <Icon className="h-5 w-5 text-accent"/> })()}
                  </div>
                )}
                <span className="text-foreground">
                  {serviceMenu.find(s => s.key === selected)?.title || 'Overview'}
                </span>
             </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <FontSwitcher />
            <ThemeToggle />

            <div className="h-8 w-[1px] bg-border/60 hidden sm:block"></div>

            <div className="flex items-center gap-3 bg-surface hover:bg-muted/60 transition-colors border border-border/60 rounded-full pl-1.5 pr-4 py-1.5 cursor-pointer shadow-sm group">
               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-xs shadow-inner shadow-black/20 group-hover:scale-105 transition-transform">
                  {profileForm.fullName ? profileForm.fullName.charAt(0).toUpperCase() : 'U'}
               </div>
               <div className="hidden xl:flex flex-col">
                 <span className="text-sm font-bold leading-none">{profileForm.fullName || 'User'}</span>
                 <span className="text-[10px] font-medium text-muted-foreground mt-1 leading-none uppercase tracking-wider">@{profileForm.username || 'username'}</span>
               </div>
            </div>

            <div className="h-8 w-[1px] bg-border/60 hidden sm:block"></div>

            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                await authApi.logout();
                window.location.href = '/login';
              }}
              className="h-10 w-10 shrink-0 border-border/60 rounded-full text-muted-foreground hover:text-white hover:bg-destructive hover:border-destructive transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile App Bottom Tab Bar */}
        <div className="lg:hidden fixed bottom-4 inset-x-4 z-50 rounded-[28px] border border-border/50 bg-surface/95 backdrop-blur-2xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.7)] px-2 py-2 flex items-center justify-around overflow-x-auto scrollbar-hide">
          {serviceMenu.map((item) => {
            const isActive = selected === item.key;
            return (
              <Link
                key={item.key}
                href={`/dashboard/${item.key}`}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[64px] rounded-2xl p-2 transition-all duration-300',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  isActive ? 'bg-primary/10 shadow-sm' : 'bg-transparent'
                )}>
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 text-primary font-bold" : "scale-100")} />
                </div>
                <span className={cn("text-[10px] font-semibold tracking-tight transition-all", isActive ? "opacity-100" : "opacity-70")}>
                  {item.title.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Main Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-0 animate-fade-in fill-mode-both duration-500 min-w-0 pb-32 overflow-x-hidden">
          <div className="mx-auto max-w-[1400px]">
            {error && <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive shadow-sm animate-fade-in flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-destructive animate-pulse"/>{error}</div>}
            {success && <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 shadow-sm animate-fade-in flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>{success}</div>}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {renderMain()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
