import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Navigation, Providers } from '@/components';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Aokiz GTO - Game Theory Optimal Poker Training',
  description: 'Master poker with GTO strategies. Analyze hands, study ranges, and improve your game.',
  keywords: ['poker', 'GTO', 'game theory', 'training', 'ranges', 'strategy'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GTO Play',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <Navigation />
          <main style={{ minHeight: 'calc(100vh - 65px)' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
