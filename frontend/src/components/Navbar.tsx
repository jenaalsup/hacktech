'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white py-4 px-6 shadow-md w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and Name */}
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Cumble Logo" 
            width={32} 
            height={32} 
          />
          <span className="text-2xl font-bold text-orange-400">cumble</span>
        </Link>
        
        {/* Navigation Links */}
        <div>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 cursor-pointer">
                  <span className="text-lg">{currentUser.email?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-orange-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/signin" className="border border-orange-400 text-orange-400 px-4 py-2 rounded-md hover:bg-orange-50">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}