'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userApi, type UserProfile } from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function SocialPanel({ keyRefresher }: { keyRefresher?: number }) {
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [blocked, setBlocked] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [keyRefresher]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [f1, f2, b] = await Promise.all([
        userApi.followers(),
        userApi.following(),
        userApi.blocked()
      ]);
      setFollowers(f1);
      setFollowing(f2);
      setBlocked(b);
    } catch (err) {
      toast.error('Failed to load social data');
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowUser = async (id: string) => {
    try {
      await userApi.unfollow(id);
      setFollowing(prev => prev.filter(u => u.authUserId !== id));
      toast.success('Unfollowed user');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const unblockUser = async (id: string) => {
    try {
      await userApi.unblock(id);
      setBlocked(prev => prev.filter(u => u.authUserId !== id));
      toast.success('Unblocked user');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const UserList = ({ users, actionLabel, actionFn, variant = 'outline' as const, buttonClassName = '' }: any) => (
    <div className="space-y-3 mt-4">
      {users.map((user: UserProfile) => {
        const initials = user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.username?.substring(0, 2).toUpperCase();
        return (
          <div key={user.authUserId} className="flex items-center justify-between glass-panel p-3 rounded-xl transition-colors hover:bg-surface/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            {actionFn && (
              <Button size="sm" variant={variant} onClick={() => actionFn(user.authUserId)} className={`h-8 ${buttonClassName}`}>
                {actionLabel}
              </Button>
            )}
          </div>
        );
      })}
      {users.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No users found.</p>}
    </div>
  );

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Network</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading network...</p>
        ) : (
          <Tabs defaultValue="followers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl glass-panel">
              <TabsTrigger value="followers" className="rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-sm transition-all">Followers</TabsTrigger>
              <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-sm transition-all">Following</TabsTrigger>
              <TabsTrigger value="blocked" className="rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-sm transition-all">Blocked</TabsTrigger>
            </TabsList>
            <TabsContent value="followers" className="animate-fade-in mt-4">
              <UserList users={followers} />
            </TabsContent>
            <TabsContent value="following" className="animate-fade-in mt-4">
              <UserList users={following} actionLabel="Unfollow" actionFn={unfollowUser} />
            </TabsContent>
            <TabsContent value="blocked" className="animate-fade-in mt-4">
              <UserList users={blocked} actionLabel="Unblock" actionFn={unblockUser} variant="ghost" buttonClassName="text-destructive hover:bg-destructive/10 hover:text-destructive" />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
