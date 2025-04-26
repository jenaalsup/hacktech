import Link from "next/link";
import MapComponent from "./map-component";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center w-full">find a pad or a lad</h1>
      <div className="flex flex-col gap-4 mb-8 w-full">
        
        {/* Map View */}
        <div className="w-full h-[500px] mt-4 mb-6">
          <MapComponent />
        </div>

        {/* TODO: List View */}
      </div>
    
    </div>
  );
}