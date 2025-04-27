// components/ProfileGuard.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function ProfileGuard({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // still waiting on Firebase?
    if (loading) return;

    // allow these paths without a profile
    if (
      pathname === '/signin' ||
      pathname === '/signup' ||
      pathname === '/profile/edit'
    ) {
      return; // Do not redirect if on these pages
    }

    // if not signed in, send to signin
    if (!currentUser) {
      router.replace('/signin'); // Redirect to signin if not signed in
      return;
    }

    // check Mongo for existing profile
    (async () => {
      try {
        const res = await fetch(
          `/api/profile?firebase_id=${currentUser.uid}`
        );
        if (!res.ok) throw new Error();
        const { exists } = await res.json();
        if (!exists) {
          router.replace('/profile/edit'); // Redirect to edit profile if it doesn't exist
        }
      } catch (err) {
        console.error('Profile check failed', err);
        // optionally: router.replace('/profile/edit')
      }
    })();
  }, [currentUser, loading, pathname, router]);

  return <>{children}</>;
}