'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirect to My Profile - resume section is now on the main profile page */
export default function ProfileResumePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile');
  }, [router]);
  return null;
}
