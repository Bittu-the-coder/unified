import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';

export const metadata: Metadata = {
  title: 'Unified',
  description: 'Unified super-app frontend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <main className="mx-auto min-h-screen max-w-[1400px] px-4 py-6 md:px-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
