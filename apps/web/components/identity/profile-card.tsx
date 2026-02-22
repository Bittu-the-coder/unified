'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileCardProps {
  user: { fullName: string; username: string; email: string; uniqueNumber?: string } | null;
  socialStats: { followers: number; following: number; blocked: number } | null;
}

export function ProfileCard({ user, socialStats }: ProfileCardProps) {
  if (!user) return <Card><CardContent className="py-6"><p className="text-muted-foreground animate-pulse">Loading Identity...</p></CardContent></Card>;

  const initials = user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.username?.substring(0, 2).toUpperCase();

  return (
    <Card className="glass-card border-border/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-24 bg-primary/10" />
      <CardHeader className="relative pt-16 pb-4">
        <div className="absolute -top-12 left-6 rounded-full p-1 bg-surface border border-border shadow-sm group-hover:shadow-md transition-shadow">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl bg-accent text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl mt-4 font-bold">{user.fullName}</CardTitle>
        <CardDescription className="text-sm">
          @{user.username} • {user.email} {user.uniqueNumber && `• #${user.uniqueNumber}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialStats && (
          <div className="grid gap-3 grid-cols-3">
            <div className="glass-panel rounded-xl p-3 text-center transition-transform hover:-translate-y-1">
              <p className="text-xl font-bold text-foreground">{socialStats.followers}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center transition-transform hover:-translate-y-1">
              <p className="text-xl font-bold text-foreground">{socialStats.following}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center transition-transform hover:-translate-y-1">
              <p className="text-xl font-bold text-foreground">{socialStats.blocked}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blocked</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">JWT Auth</Badge>
          <Badge variant="outline" className="border-border/60">Session Management</Badge>
          <Badge variant="warning" className="bg-accent/10 text-accent border-transparent hover:bg-accent/20 transition-colors">Profile Management</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
