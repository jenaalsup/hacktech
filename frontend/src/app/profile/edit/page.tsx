'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  state: string;
  city: string;
  neighborhoods: string[];
  looking_for_roommate: boolean;
  looking_for_friend: boolean;
  start_date: string;
  end_date: string;
  other_notes: string | null;
}

export default function EditProfile() {
  const router = useRouter();
  const { currentUser } = useAuth(); // assuming you store the logged-in user here
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    country: '',
    state: '',
    city: '',
    neighborhoods: [],
    looking_for_roommate: false,
    looking_for_friend: false,
    start_date: '',
    end_date: '',
    other_notes: '',
  });

  // Pre-fill email if available
  useEffect(() => {
    if (currentUser?.email) {
      setProfileData((prev) => ({ ...prev, email: currentUser.email ?? '' }));
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined; // Type assertion for checked
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNeighborhoodChange = (index: number, value: string) => {
    const updatedNeighborhoods = [...profileData.neighborhoods || []];
    updatedNeighborhoods[index] = value;
    setProfileData((prev) => ({
      ...prev,
      neighborhoods: updatedNeighborhoods,
    }));
  };

  const addNeighborhood = () => {
    setProfileData((prev) => ({
      ...prev,
      neighborhoods: [...prev.neighborhoods, ''],
    }));
  };

  const removeNeighborhood = (index: number) => {
    const updatedNeighborhoods = [...profileData.neighborhoods];
    updatedNeighborhoods.splice(index, 1);
    setProfileData((prev) => ({
      ...prev,
      neighborhoods: updatedNeighborhoods,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Save the profileData to your backend here
      console.log('Submitting profile:', profileData);
      // After saving, maybe redirect somewhere
      router.push('/profile'); // or wherever you want
    } catch (error) {
      console.error('Failed to save profile', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">Complete Your Profile</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="first_name"
              placeholder="First Name"
              value={profileData.first_name}
              onChange={handleChange}
              className="input"
              required
            />
            <input
              name="last_name"
              placeholder="Last Name"
              value={profileData.last_name}
              onChange={handleChange}
              className="input"
              required
            />
            <input
              name="email"
              placeholder="Email"
              value={profileData.email}
              onChange={handleChange}
              className="input"
              disabled
            />
            <input
              name="phone_number"
              placeholder="Phone Number"
              value={profileData.phone_number}
              onChange={handleChange}
              className="input"
            />
            <input
              name="country"
              placeholder="Country"
              value={profileData.country}
              onChange={handleChange}
              className="input"
            />
            <input
              name="state"
              placeholder="State"
              value={profileData.state}
              onChange={handleChange}
              className="input"
            />
            <input
              name="city"
              placeholder="City"
              value={profileData.city}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Neighborhoods</label>
            {profileData.neighborhoods.map((neighborhood, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => handleNeighborhoodChange(index, e.target.value)}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeNeighborhood(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addNeighborhood}
              className="text-sm text-orange-600 hover:underline"
            >
              + Add Neighborhood
            </button>
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="looking_for_roommate"
                checked={profileData.looking_for_roommate}
                onChange={handleChange}
              />
              <span>Looking for a roommate</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="looking_for_friend"
                checked={profileData.looking_for_friend}
                onChange={handleChange}
              />
              <span>Looking for a friend</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={profileData.start_date.split('T')[0]} // only keep YYYY-MM-DD
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={profileData.end_date.split('T')[0]}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <textarea
              name="other_notes"
              placeholder="Other notes"
              value={profileData.other_notes || ''}
              onChange={handleChange}
              className="input w-full h-24"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
