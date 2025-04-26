import Link from "next/link";

export default function SignUp() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="username" className="block mb-1">Username</label>
              <input 
                type="text" 
                id="username" 
                className="w-full p-2 border rounded-md"
                placeholder="Enter a username" 
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full p-2 border rounded-md" 
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                className="w-full p-2 border rounded-md" 
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block mb-1">City</label>
              <input 
                type="text" 
                id="city" 
                className="w-full p-2 border rounded-md" 
                placeholder="Enter your city"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Create Account
            </button>
          </form>
        </div>
        
        <p className="text-center">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}