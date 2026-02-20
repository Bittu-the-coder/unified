'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, authTokenStore } from '@/lib/api';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setInfo('');
      const data = await authApi.login({ email, password });
      authTokenStore.setTokens(data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onForgotPassword = async () => {
    try {
      setError('');
      const data = await authApi.forgotPassword(forgotEmail);
      setInfo(
        data.resetToken
          ? `Reset token (dev only): ${data.resetToken}`
          : 'If account exists, reset token is issued.',
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onResetPassword = async () => {
    try {
      setError('');
      await authApi.resetPassword({ resetToken, newPassword });
      setInfo('Password reset successful. You can login now.');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell
      title="Welcome back to Unified"
      description="Sign in once and continue with messaging, productivity, and cloud workflows from one place."
      footerLabel="New user?"
      footerLinkLabel="Create account"
      footerLinkHref="/register"
    >
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your workspace securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-emerald-600">{info}</p>}
            <Button className="w-full" type="submit">
              Login
            </Button>
          </form>
          <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Forgot password</p>
            <div className="flex gap-2">
              <Input placeholder="Account email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              <Button variant="outline" onClick={onForgotPassword}>Send</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Reset token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
              <Input placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button variant="secondary" onClick={onResetPassword}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

