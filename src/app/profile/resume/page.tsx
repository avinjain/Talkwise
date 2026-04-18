'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirect to My Profile — new-job prep lives on the main profile page */
export default function ProfileResumePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile');
  }, [router]);
  return null;
}
