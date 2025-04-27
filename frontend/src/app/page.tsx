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
  state?: string;
  city: string;
}

type SortColumn = 'name' | 'email' | 'country' | 'state' | 'city' | 'neighborhood';
type SortDirection = 'asc' | 'desc';

export default function Home() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      // Toggle asc/desc if clicking same column
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const filteredAndSorted = users
    .filter(user => {
      const search = searchTerm.toLowerCase();
      const combined = [
        ...user.neighborhoods,
        user.city,
        user.state || '',
        user.first_name,
        user.last_name,
        user.email,
      ].join(' ').toLowerCase();
      return combined.includes(search);
    })
    .sort((a, b) => {
      const getValue = (u: User) => {
        switch (sortColumn) {
          case 'name': return `${u.first_name} ${u.last_name}`.toLowerCase();
          case 'email': return u.email.toLowerCase();
          case 'country': return (u.country || '').toLowerCase();
          case 'state': return (u.state || '').toLowerCase();
          case 'city': return u.city.toLowerCase();
          case 'neighborhood': return (u.neighborhoods?.[0] || '').toLowerCase();
        }
      };
      const valA = getValue(a);
      const valB = getValue(b);
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center w-full">find a caltech roommate or a friend for the summer 🏡👯‍♀️</h1>

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
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                </div>

                <table className="min-w-full bg-white border border-gray-200 rounded-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th onClick={() => handleSort('name')} className="text-left px-4 py-2 cursor-pointer">
                        Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('email')} className="text-left px-4 py-2 cursor-pointer">
                        Email {sortColumn === 'email' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('country')} className="text-left px-4 py-2 cursor-pointer">
                        Country {sortColumn === 'country' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('state')} className="text-left px-4 py-2 cursor-pointer">
                        State {sortColumn === 'state' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('city')} className="text-left px-4 py-2 cursor-pointer">
                        City {sortColumn === 'city' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => handleSort('neighborhood')} className="text-left px-4 py-2 cursor-pointer">
                        Neighborhood {sortColumn === 'neighborhood' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.length > 0 ? (
                      filteredAndSorted.map(user => (
                        <tr key={user._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <Link href={`/user/${user.email.split('@')[0]}`} className="text-orange-600 hover:text-orange-700 hover:underline">
                              {user.first_name} {user.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.country || ''}</td>
                          <td className="px-4 py-2">{user.state || ''}</td>
                          <td className="px-4 py-2">{user.city || ''}</td>
                          <td className="px-4 py-2">{user.neighborhoods?.[0] || ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center px-4 py-8 text-gray-500">
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
