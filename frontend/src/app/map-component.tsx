'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]); // Replace with your neighborhood type

  useEffect(() => {
    // Initialize the map only once and when the container is available
    if (map.current || !mapContainer.current) return;

    // Set access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    // Create the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [-122.4194, 37.7749], // San Francisco coordinates
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Handle map clicks to select neighborhoods
    map.current.on('click', (e) => {
      const features = map.current?.queryRenderedFeatures(e.point);
      if (features && features.length) {
        const neighborhood = features[0].properties.name; // Adjust based on your data
        setSelectedNeighborhood(neighborhood);
      }
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = event.target.value;
    setCity(selectedCity);
    loadNeighborhoods(selectedCity);
  };

  const loadNeighborhoods = (city: string) => {
    // Fetch or define neighborhoods based on the selected city
    // Example: setNeighborhoods([{ name: 'Pacific Heights' }, { name: 'Noe Valley' }, ...]);
    // You can also add markers for neighborhoods here if you have their coordinates
  };

  return (
    <div>
      <select onChange={handleCityChange}>
        <option value="">Select a city</option>
        <option value="San Francisco">San Francisco</option>
        {/* Add more cities as needed */}
      </select>

      <div ref={mapContainer} className="w-full h-96 rounded-lg shadow" />

      {selectedNeighborhood && <p>Selected Neighborhood: {selectedNeighborhood}</p>}
    </div>
  );
}