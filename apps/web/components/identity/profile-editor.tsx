'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { userApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function ProfileEditor({
  initialFullName,
  initialUsername,
  onProfileUpdated
}: {
  initialFullName: string,
  initialUsername: string,
  onProfileUpdated?: (name: string, user: string) => void
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(initialUsername);
  const [isLoading, setIsLoading] = useState(false);

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      await userApi.updateMe({ fullName, username });
      toast.success('Profile updated successfully');
      if (onProfileUpdated) onProfileUpdated(fullName, username);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Profile Editor</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
          <Input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background/50 border-border/50 focus:bg-background transition-colors" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background/50 border-border/50 focus:bg-background transition-colors" />
        </div>
        <Button onClick={saveProfile} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md">
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
