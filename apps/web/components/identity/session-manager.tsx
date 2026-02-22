'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, type AuthSession } from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function SessionManager() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await authApi.sessions();
      setSessions(data);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await authApi.revokeSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Session revoked');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const logoutAllDevices = async () => {
    try {
      await authApi.logoutAll();
      toast.success('Logged out from all devices');
      setTimeout(() => {
        authApi.logout().finally(() => window.location.href = '/login');
      }, 1500);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Active Sessions</CardTitle>
          <CardDescription>Manage your connected devices.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={logoutAllDevices} className="text-destructive hover:bg-destructive/10">
          Sign out all
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading sessions...</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session._id} className="flex items-center justify-between rounded-xl glass-panel p-4 transition-all hover:bg-surface/50">
                <div>
                  <p className="font-semibold text-sm">{session.userAgent || 'Unknown Device'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Last active: {new Date(session.updatedAt).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => revokeSession(session._id)} className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                  Revoke
                </Button>
              </div>
            ))}
            {!sessions.length && <p className="text-sm text-muted-foreground px-2">No active sessions.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
