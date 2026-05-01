import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'talkwise.life — TalkWise',
  description: 'Sign in or create your TalkWise account to start practising conversations.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
