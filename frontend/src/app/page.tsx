'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import MapComponent from "./map-component";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  neighborhoods: string[];
  country: string;
  city: string;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          console.error('Failed to fetch users');
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('API /api/users did not return an array');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const combinedFields = [
      user.first_name,
      user.last_name,
      user.email,
      user.country,
      user.city,
      ...(user.neighborhoods || []),
    ].join(' ').toLowerCase();
    return combinedFields.includes(search);
  });

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center w-full">find a pad or a lad</h1>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-md ${viewMode === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Map View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-md ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          List View
        </button>
      </div>

      {/* Map or List View */}
      <div className="w-full">
        {viewMode === 'map' ? (
          <div className="w-full h-[500px] mt-4 mb-6">
            <MapComponent />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">Loading users...</div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="mb-4 flex justify-end">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full md:w-1/2"
                  />
                </div>

                <table className="min-w-full bg-white border border-gray-200 rounded-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-4 py-2">Name</th>
                      <th className="text-left px-4 py-2">Email</th>
                      <th className="text-left px-4 py-2">Country</th>
                      <th className="text-left px-4 py-2">City</th>
                      <th className="text-left px-4 py-2">Neighborhood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user._id} className="border-t">
                          <td className="px-4 py-2">
                            <Link href={`/user/${user.email.split('@')[0]}`} className="text-blue-600 hover:underline">
                              {user.first_name} {user.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.country || 'N/A'}</td>
                          <td className="px-4 py-2">{user.city || 'N/A'}</td>
                          <td className="px-4 py-2">{user.neighborhoods?.[0] || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center px-4 py-8 text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
