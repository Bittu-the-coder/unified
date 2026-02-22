import { FontProvider } from '@/components/providers/font-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Inter, Outfit, Plus_Jakarta_Sans, Raleway, Roboto } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', style: ['normal', 'italic'] });

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
      <body className={`${inter.variable} ${roboto.variable} ${dmSans.variable} ${plusJakarta.variable} ${outfit.variable} ${raleway.variable} min-h-screen font-sans`}>
        <FontProvider>
          <ThemeProvider>
            <TooltipProvider>
              <RegisterServiceWorker />
              <main className="mx-auto min-h-screen max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-6 lg:py-6">{children}</main>
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </FontProvider>
      </body>
    </html>
  );
}
