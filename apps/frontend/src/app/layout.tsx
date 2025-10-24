import { type Metadata, type Viewport } from 'next';
import { Inter } from 'next/font/google';

import { getServerSession } from '../lib/session.server';
import { cn } from '../lib/utils';

import { AppProviders } from './providers';

import './global.css';

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'ProServ Estimator',
  description: 'Modern estimate planning workspace for consulting and professional service teams.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'hsl(210, 20%, 98%)' }, { media: '(prefers-color-scheme: dark)', color: 'hsl(222, 47%, 11%)' }],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const session = getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans text-foreground', fontSans.variable)}>
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
