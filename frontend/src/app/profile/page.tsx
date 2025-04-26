'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/signin');
    }
  }, [currentUser, loading, router]);
  
  if (loading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p><strong>Email:</strong> {currentUser.email}</p>
        <p><strong>User ID:</strong> {currentUser.uid}</p>
      </div>
    </div>
  );
}