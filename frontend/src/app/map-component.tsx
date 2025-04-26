'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
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
    
    // Add some sample roommate locations
    const addMarker = (lng: number, lat: number, popup: string) => {
      new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(popup))
        .addTo(map.current!);
    };
    
    // Example markers for potential roommates
    addMarker(-122.4194, 37.7749, '<h3>Roommate 1</h3><p>$800/month</p>');
    addMarker(-122.4300, 37.7700, '<h3>Roommate 2</h3><p>$950/month</p>');
    addMarker(-122.4100, 37.7800, '<h3>Roommate 3</h3><p>$1100/month</p>');
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  return <div ref={mapContainer} className="w-full h-full rounded-lg shadow" />;
}