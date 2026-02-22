'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { userApi, type UserProfile } from '@/lib/api';
import { Search } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function UserDiscovery({ onFollowChange }: { onFollowChange?: () => void }) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const users = await userApi.search(userSearchQuery, 8);
      setUserSearchResults(users);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const followUser = async (id: string) => {
    try {
      await userApi.follow(id);
      toast.success('User followed');
      await searchUsers();
      if (onFollowChange) onFollowChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const blockUser = async (id: string) => {
    try {
      await userApi.block(id);
      toast.success('User blocked');
      await searchUsers();
      if (onFollowChange) onFollowChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card className="glass-card border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">User Discovery</CardTitle>
        <CardDescription>Search and connect with other users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, username or email"
              className="pl-9 bg-background/50 border-border/50"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
          </div>
          <Button onClick={searchUsers} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          {userSearchResults.map((result) => (
            <div key={result.authUserId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl glass-panel p-4 hover:bg-surface/50 transition-colors">
              <div>
                <p className="font-semibold">{result.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">@{result.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => followUser(result.authUserId)} className="bg-secondary text-white hover:bg-secondary/90 shadow-sm">
                  Follow
                </Button>
                <Button size="sm" variant="outline" onClick={() => blockUser(result.authUserId)} className="border-border/60 hover:bg-destructive/10 hover:text-destructive">
                  Block
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && userSearchQuery && userSearchResults.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 text-center">No users found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
