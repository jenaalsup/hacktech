'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function UserProfile() {
  const params = useParams();
  const usernameFromUrl = params.username as string; // from URL like /user/jonathan
  const { currentUser } = useAuth();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Check: is the person viewing their own profile?
  const currentUserUsername = currentUser?.email?.split('@')[0]; // derive username from email
  const isViewingOwnProfile = currentUserUsername === usernameFromUrl;

  useEffect(() => {
    if (usernameFromUrl) {
      fetchUserProfile(usernameFromUrl);
    }
  }, [usernameFromUrl]);

  const fetchUserProfile = async (username: string) => {
    try {
      const response = await fetch(`/api/user?username=${username}`);
      const data = await response.json();
      setUserProfile(data);
      setProfilePicture(data.photoURL || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isViewingOwnProfile) return; // Prevent if viewing someone else
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-gray-100 p-8 rounded-xl shadow-md relative">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
          {isViewingOwnProfile ? 'Your Profile' : `${usernameFromUrl}'s Profile`}
        </h1>

        {/* Profile Picture */}
        <div className="flex justify-center mb-8">
          <label className={isViewingOwnProfile ? 'cursor-pointer' : ''}>
            <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center text-orange-600">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">
                  {userProfile.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {isViewingOwnProfile && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            )}
          </label>
        </div>

        <div className="space-y-6">
          <div className="pb-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700">Email</p>
                <p className="font-medium text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Account ID</p>
                <p className="font-medium text-sm text-gray-800 font-mono">{userProfile.uid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Account Created</p>
                <p className="font-medium text-gray-900">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString()
                    : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {isViewingOwnProfile && (
            <div className="flex justify-end">
              <button
                className="py-1 px-2 border border-red-600 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                style={{ position: 'absolute', bottom: '10px', right: '10px' }}
                onClick={() => {
                  alert('Delete your profile (only visible to yourself)');
                }}
              >
                Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
