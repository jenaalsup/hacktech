import Link from "next/link";
import MapComponent from "./map-component";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Roommate Finder</h1>
      <div className="flex flex-col gap-4 mb-8">
        <p>Find summer roommates in your city</p>
        
        {/* Map View */}
        <div className="w-full h-[500px] mt-4 mb-6">
          <MapComponent />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <Link href="/signin" className="text-blue-500 hover:underline">
          Sign In
        </Link>
        <Link href="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}