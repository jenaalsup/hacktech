'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // Simulating auth check - replace with your actual auth logic
  useEffect(() => {
    // Check if user is signed in - this is just a placeholder
    const checkAuth = () => {
      // For demo purposes, consider signed in on non-signin/signup pages
      setIsSignedIn(!['/signin', '/signup'].includes(pathname));
    };
    
    checkAuth();
  }, [pathname]);

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
          {isSignedIn ? (
            <Link href="/profile">
              <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 cursor-pointer">
                <span className="text-lg">P</span>
              </div>
            </Link>
          ) : (
            <Link href="/signin" className="border border-orange-400 text-orange-400 px-4 py-2 rounded-md hover:bg-orange-50">
              Sign up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}