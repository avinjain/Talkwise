'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy redirect — new-job prep now lives at /prepare. */
export default function ProfileResumePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/prepare');
  }, [router]);
  return null;
}
