import Link from "next/link";

export default function UserProfile({ params }: { params: { username: string } }) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">User Profile: {params.username}</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">User Information</h2>
          <p className="text-gray-600">Username: {params.username}</p>
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Location</h2>
          <p className="text-gray-600">City: San Francisco</p>
        </div>
        
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
          Contact User
        </button>
      </div>
      
      <Link href="/" className="text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}