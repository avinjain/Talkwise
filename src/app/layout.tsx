import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkWise — Communication Training Platform',
  description:
    'Practice high-stakes conversations with AI-driven personas. Build confidence, refine articulation, and master professional communication.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
