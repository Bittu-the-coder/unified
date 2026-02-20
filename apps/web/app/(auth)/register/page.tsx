'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<{ email?: boolean; username?: boolean }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await authApi.register(form);
      router.push('/login');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const data =
        field === 'email'
          ? await authApi.checkAvailability({ email: trimmed })
          : await authApi.checkAvailability({ username: trimmed });
      setAvailability((prev) => ({
        ...prev,
        [field]: field === 'email' ? data.emailAvailable : data.usernameAvailable,
      }));
    } catch {
      setAvailability((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthShell
      title="Create your Unified workspace"
      description="Register once and get immediate access to identity, productivity, messaging, and cloud modules."
      footerLabel="Already have an account?"
      footerLinkLabel="Login"
      footerLinkHref="/login"
    >
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Start using all Unified services.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={(e) => void checkAvailability('email', e.target.value)}
            />
            {availability.email !== undefined && (
              <p className={`text-xs ${availability.email ? 'text-emerald-600' : 'text-red-600'}`}>
                {availability.email ? 'Email is available' : 'Email is already in use'}
              </p>
            )}
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              onBlur={(e) => void checkAvailability('username', e.target.value)}
            />
            {availability.username !== undefined && (
              <p className={`text-xs ${availability.username ? 'text-emerald-600' : 'text-red-600'}`}>
                {availability.username ? 'Username is available' : 'Username is already in use'}
              </p>
            )}
            <Input
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" type="submit">
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

