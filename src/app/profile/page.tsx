'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function ProfileRedirect() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      // not signed in → back to signin
      router.replace('/signin');
    } else {
      // extract username before the @
      const username = currentUser.email!.split('@')[0];
      router.replace(`/user/${username}`);
    }
  }, [currentUser, loading, router]);

  // while we’re figuring it out, render nothing (or a spinner)
  return null;
}
