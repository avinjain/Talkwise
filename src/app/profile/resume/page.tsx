'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy redirect — resume tooling now lives at /resume (Build my resume). */
export default function ProfileResumePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/resume');
  }, [router]);
  return null;
}
