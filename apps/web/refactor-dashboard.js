const fs = require('fs');
const lines = fs.readFileSync('apps/web/components/workspace/workspace-dashboard.tsx', 'utf-8').split('\n');

lines.splice(3, 0, `import { ProfileCard } from '@/components/identity/profile-card';
import { ProfileEditor } from '@/components/identity/profile-editor';
import { PasswordManager } from '@/components/identity/password-manager';
import { SessionManager } from '@/components/identity/session-manager';
import { UserDiscovery } from '@/components/identity/user-discovery';
import { SocialPanel } from '@/components/identity/social-panel';`);

const userIndex = lines.findIndex(l => l.includes('const [user, setUser] = useState'));
lines.splice(userIndex, 0, '  const [socialKey, setSocialKey] = useState(0);');

const start = lines.findIndex(l => l.includes('const renderAuthUser = () => ('));
const end = lines.findIndex((l, i) => i > start && l.trim() === ');' && lines[i+2] && lines[i+2].includes('const renderProductivity'));

const newBody = `  const renderAuthUser = () => (
    <div className="space-y-6 animate-fade-in">
      <ProfileCard user={user} socialStats={socialStats} />
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileEditor
          initialFullName={profileForm.fullName || user?.fullName || ''}
          initialUsername={profileForm.username || user?.username || ''}
          onProfileUpdated={(name, username) => {
            setProfileForm({ fullName: name, username });
            setUser(prev => prev ? { ...prev, fullName: name, username } : null);
          }}
        />
        <PasswordManager />
      </div>
      <SessionManager />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <UserDiscovery onFollowChange={() => setSocialKey(k => k + 1)} />
          <Card className="glass-card border-border/40">
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
                  className="bg-background/50 border-border/50"
                />
                <Button variant="outline" onClick={fetchPublicProfile} className="w-full sm:w-auto">Fetch</Button>
              </div>
              {publicProfile && (
                <div className="rounded-xl glass-panel p-4 mt-2">
                  <p className="font-medium text-lg">{publicProfile.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{publicProfile.username}</p>
                  {publicProfile.uniqueNumber ? (
                    <p className="text-xs font-mono bg-muted/50 inline-block px-1.5 py-0.5 rounded mt-1">#{publicProfile.uniqueNumber}</p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <SocialPanel keyRefresher={socialKey} />
      </div>
    </div>
  );`;

lines.splice(start, end - start + 1, newBody);
fs.writeFileSync('apps/web/components/workspace/workspace-dashboard.tsx', lines.join('\n'));
