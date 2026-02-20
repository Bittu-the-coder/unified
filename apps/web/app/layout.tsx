import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { Manrope, Space_Grotesk } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Unified Workspace',
  description: 'Unified super-app frontend',
  manifest: '/manifest.webmanifest',
  applicationName: 'Unified',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Unified',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} min-h-screen`}>
        <ThemeProvider>
          <RegisterServiceWorker />
          <main className="mx-auto min-h-screen max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-6 lg:py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
