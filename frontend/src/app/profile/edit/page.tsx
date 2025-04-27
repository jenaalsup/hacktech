'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { parse } from 'papaparse';

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
  firebase_id?: string;
  profile_picture?: string;
}

interface CSVRow {
  city_name: string;
  state_name: string;
}

export default function EditProfile() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    country: 'USA',
    state: '',
    city: '',
    neighborhoods: [],
    looking_for_roommate: false,
    looking_for_friend: false,
    start_date: '',
    end_date: '',
    other_notes: '',
    profile_picture: undefined,
  });

  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCSV() {
      try {
        const response = await fetch('/data/usneighborhoods.csv');
        const csvText = await response.text();
        parse(csvText, {
          header: true,
          complete: (results: any) => {
            const data: CSVRow[] = results.data.filter((row: CSVRow) => row.city_name && row.state_name);
            setCsvData(data);

            const uniqueStates = Array.from(new Set(data.map(d => d.state_name))).sort();
            setAvailableStates(uniqueStates);
          },
          error: (error: any) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Failed to load CSV', error);
      }
    }

    loadCSV();
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      setProfileData((prev) => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const load = async () => {
      const res = await fetch(`/api/profile?firebase_id=${currentUser.uid}`);
      if (!res.ok) return;
      const { exists, profile } = await res.json();
      if (exists && profile) {
        setProfileData({
          ...profile,
          other_notes: profile.other_notes ?? '',
        });
      }
    };
    load();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'state') {
      const filteredCities = csvData
        .filter(d => d.state_name === value)
        .map(d => d.city_name);
      const uniqueCities = Array.from(new Set(filteredCities)).sort();
      setAvailableCities(uniqueCities);

      // Reset city if state changes
      setProfileData(prev => ({
        ...prev,
        state: value,
        city: '',
      }));
    }
  };

  const handleNeighborhoodChange = (index: number, value: string) => {
    const updatedNeighborhoods = [...profileData.neighborhoods];
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

  // if they already had a profile_picture saved, show it
  useEffect(() => {
    if (profileData.profile_picture) {
      setPreview(profileData.profile_picture);
    }
  }, [profileData.profile_picture]);

  // when they pick a file, crop & compress it
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/jpg'].includes(file.type)) {
      return alert('Please select a JPG/JPEG image.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const side = Math.min(width, height);
        const sx = (width - side) / 2;
        const sy = (height - side) / 2;
        // final size: either 480 or the side length if smaller
        const finalSize = side > 480 ? 480 : side;
        const canvas = document.createElement('canvas');
        canvas.width = finalSize;
        canvas.height = finalSize;
        const ctx = canvas.getContext('2d')!;
        if (side > 480) {
          ctx.drawImage(img, sx, sy, side, side, 0, 0, 480, 480);
        } else {
          ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);
        }
        // get a JPEG Data-URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProcessedImage(dataUrl);
        setPreview(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          firebase_id: currentUser?.uid,
          profile_picture: processedImage, // include the cropped/compressed JPEG
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save profile', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-900">Complete Your Profile</h2>
        {/*
         Avatar uploader: click to open file picker,
         hover shows “Upload Photo” overlay
        */}
        <div className="flex justify-center mb-4">
        <div
          className="relative group w-24 h-24 rounded-full overflow-hidden bg-gray-200 cursor-pointer border-4 border-orange-600"
          onClick={() => fileInputRef.current?.click()}
        >
            {preview ? (
              <img src={preview} className="object-cover w-full h-full" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-4xl text-orange-600">
                {profileData.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <button type="button" className="text-white text-sm">
                Upload Photo
              </button>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="flex flex-col">
              <label htmlFor="first_name" className="text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                id="first_name"
                name="first_name"
                value={profileData.first_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label htmlFor="last_name" className="text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                id="last_name"
                name="last_name"
                value={profileData.last_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                className="input"
                disabled
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col">
              <label htmlFor="phone_number" className="text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                id="phone_number"
                name="phone_number"
                value={profileData.phone_number}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Country Dropdown */}
            <div className="flex flex-col">
              <label htmlFor="country" className="text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                id="country"
                name="country"
                value="USA"
                disabled
                className="input"
              />
            </div>

            {/* State Dropdown */}
            <div className="flex flex-col">
              <label htmlFor="state" className="text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                id="state"
                name="state"
                value={profileData.state}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a state</option>
                {availableStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div className="flex flex-col">
              <label htmlFor="city" className="text-sm font-medium text-gray-700 mb-1">City *</label>
              <select
                id="city"
                name="city"
                value={profileData.city}
                onChange={handleChange}
                className="input"
                required
                disabled={!profileData.state}
              >
                <option value="">Select a city</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Neighborhoods */}
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

          {/* Checkboxes */}
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

          {/* Start and End Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={profileData.start_date.split('T')[0]}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input
                type="date"
                name="end_date"
                value={profileData.end_date.split('T')[0]}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>

          {/* Other Notes */}
          <div>
            <textarea
              name="other_notes"
              placeholder="Anything else you'd like to share"
              value={profileData.other_notes || ''}
              onChange={handleChange}
              className="input w-full h-24"
            />
          </div>

          {/* Submit Button */}
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
