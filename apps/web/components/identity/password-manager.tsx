'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function PasswordManager() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const savePassword = async () => {
    try {
      setIsLoading(true);
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed. Please login again.');
      setTimeout(() => {
        authApi.logout().finally(() => window.location.href = '/login');
      }, 1500);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Security</CardTitle>
        <CardDescription>Change your password to secure your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-background/50 border-border/50 transition-colors" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background/50 border-border/50 transition-colors" />
        </div>
        <Button variant="outline" onClick={savePassword} disabled={isLoading || !currentPassword || !newPassword} className="w-full sm:w-auto border-accent text-accent hover:bg-accent hover:text-white transition-colors">
          {isLoading ? 'Changing...' : 'Change Password'}
        </Button>
      </CardContent>
    </Card>
  );
}
