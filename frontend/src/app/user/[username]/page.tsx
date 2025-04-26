import Link from "next/link";
 
 export default function Profile() {
   return (
     <div className="min-h-screen p-8">
       <h1 className="text-3xl font-bold mb-6">My Profile</h1>
       
       <div className="bg-white shadow-md rounded-lg p-6 mb-6">
         <div className="mb-4">
           <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
           <p className="text-gray-600">Username: username123</p>
           <p className="text-gray-600">Email: user@example.com</p>
         </div>
         
         <div className="mb-4">
           <h2 className="text-xl font-semibold mb-2">Location Preferences</h2>
           <p className="text-gray-600">Current City: San Francisco</p>
         </div>
         
         <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
           Edit Profile
         </button>
       </div>
       
       <Link href="/" className="text-blue-500 hover:underline">
         Back to Home
       </Link>
     </div>
   );
 }