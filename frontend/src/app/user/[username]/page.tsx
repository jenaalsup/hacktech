// app/user/[username]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Profile {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  state?: string;
  city?: string;
  neighborhoods?: string[];
  looking_for_roommate?: boolean;
  looking_for_friend?: boolean;
  start_date?: string;
  end_date?: string;
  other_notes?: string;
  profile_picture?: string;
}

export default function UserProfile() {
  const { username } = useParams();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  const currentUsername = currentUser?.email?.split('@')[0] || '';
  const isOwnProfile = username === currentUsername;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/user?username=${username}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error('Fetch error');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }
    fetchProfile();
  }, [username]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">User “{username}” not found.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const initial = profile.first_name
    ? profile.first_name.charAt(0).toUpperCase()
    : username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-gray-100 p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-900">
          {isOwnProfile ? 'Your Profile' : `${username}'s Profile`}
        </h1>

        <div className="flex justify-center mb-4">
          {profile.profile_picture ? (
            <img
              src={profile.profile_picture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-orange-600"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 text-4xl">
              {initial}
            </div>
          )}
        </div>

        {fullName && (
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
            {fullName}
          </h2>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Profile Details</h3>
          <div className="space-y-3">
            {profile.phone_number && (
              <div>
                <p className="text-sm text-gray-700">Phone number</p>
                <p className="font-medium text-gray-900">{profile.phone_number}</p>
              </div>
            )}
            {profile.state && (
              <div>
                <p className="text-sm text-gray-700">State</p>
                <p className="font-medium text-gray-900">{profile.state}</p>
              </div>
            )}
            {profile.city && (
              <div>
                <p className="text-sm text-gray-700">City</p>
                <p className="font-medium text-gray-900">{profile.city}</p>
              </div>
            )}
            {profile.neighborhoods && profile.neighborhoods.length > 0 && (
              <div>
                <p className="text-sm text-gray-700">Neighborhoods</p>
                <p className="font-medium text-gray-900">
                  {profile.neighborhoods.join(', ')}
                </p>
              </div>
            )}
            {typeof profile.looking_for_roommate === 'boolean' && (
              <div>
                <p className="text-sm text-gray-700">Looking for roommates</p>
                <p className="font-medium text-gray-900">
                  {profile.looking_for_roommate ? 'Yes' : 'No'}
                </p>
              </div>
            )}
            {typeof profile.looking_for_friend === 'boolean' && (
              <div>
                <p className="text-sm text-gray-700">Looking for friends</p>
                <p className="font-medium text-gray-900">
                  {profile.looking_for_friend ? 'Yes' : 'No'}
                </p>
              </div>
            )}
            {profile.start_date && (
              <div>
                <p className="text-sm text-gray-700">Start date</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {profile.end_date && (
              <div>
                <p className="text-sm text-gray-700">End date</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {profile.other_notes && (
              <div>
                <p className="text-sm text-gray-700">Other notes</p>
                <p className="font-medium text-gray-900">{profile.other_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
