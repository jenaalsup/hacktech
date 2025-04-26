'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { currentUser, loading, deleteUser } = useAuth(); // Assuming you have a deleteUser function
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | ArrayBuffer | null>(currentUser?.photoURL || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/signin');
    } else if (currentUser) {
      setProfilePicture(currentUser.photoURL);
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result); // Update the profile picture preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your profile? This action cannot be undone.");
    if (confirmDelete) {
      try {
        await deleteUser(); // Call the function to delete the user
        router.push('/signup'); // Redirect to signup or another page after deletion
      } catch (error) {
        setError('Failed to delete profile. Please try again.'); // Display the error message
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-gray-100 p-8 rounded-xl shadow-md relative">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Your Profile</h1>
        
        {/* Profile Picture */}
        <div className="flex justify-center mb-8">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center text-orange-600">
              {profilePicture ? (
                <img src={profilePicture as string} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{currentUser.email?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden" // Hide the file input
            />
          </label>
        </div>
        
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700">Email</p>
                <p className="font-medium text-gray-900">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Account ID</p>
                <p className="font-medium text-sm text-gray-800 font-mono">{currentUser.uid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Account Created</p>
                <p className="font-medium text-gray-900">
                  {currentUser.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                    : 'Not available'}
                </p>
              </div>
            </div>
          </div>
          
          {error && <p className="text-red-500">{error}</p>}
          
          <div className="flex justify-end">
            <button 
              onClick={handleDelete}
              className="py-1 px-2 border border-red-600 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
              style={{ position: 'absolute', bottom: '10px', right: '10px' }}
            >
              Delete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}