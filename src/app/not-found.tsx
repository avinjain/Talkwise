'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <Logo size={80} />
      <h1 className="text-2xl font-bold text-slate-900 mt-4">Page not found</h1>
      <p className="text-slate-500 mt-2 mb-6">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover">
        Go home
      </Link>
    </div>
  );
}
