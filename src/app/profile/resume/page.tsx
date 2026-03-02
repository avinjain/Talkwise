'use client';

import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ProfileDetailsPanel from '@/components/ProfileDetailsPanel';

export default function ProfileResumePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader backHref="/profile" backLabel="My Profile" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Resume & Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Optimise your resume, analyse LinkedIn alignment, and get core positioning for interviews.
            </p>
          </div>

          <ProfileDetailsPanel />

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => router.push('/profile')}
              className="px-5 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← Back to My Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
