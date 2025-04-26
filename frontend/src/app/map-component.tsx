'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { parse } from 'papaparse';

// Define the type for neighborhood data
interface Neighborhood {
  neighborhood: string;
  neighborhood_ascii: string;
  lat: string;
  lng: string;
  city_name: string;
  city_id: string;
  state_name: string;
  state_id: string;
  source: string;
  timezone: string;
  zips: string;
  county_fips: string;
  county_name: string;
  id: string;
}

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visibleNeighborhoods, setVisibleNeighborhoods] = useState<string[]>([]);

  // Load CSV data
  useEffect(() => {
    async function loadCSVData() {
      try {
        setIsLoading(true);
        const response = await fetch('/data/usneighborhoods.csv');
        const csvText = await response.text();
        
        parse<Neighborhood>(csvText, {
          header: true,
          complete: (results) => {
            const validData = results.data.filter(n => n.neighborhood && n.lat && n.lng);
            setAllNeighborhoods(validData);
            
            // Extract unique cities
            const uniqueCities = Array.from(
              new Set(validData.map(item => item.city_name))
            ).filter(Boolean).sort();
            
            setCities(uniqueCities);
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setIsLoading(false);
      }
    }
    
    loadCSVData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-95.7129, 37.0902], // Center of US
      zoom: 3
    });
    
    map.current.addControl(new mapboxgl.NavigationControl());

    // Track visible neighborhoods when the map moves
    map.current.on('moveend', updateVisibleNeighborhoods);
    
    // Clean up on unmount
    return () => {
      clearMarkers();
      if (map.current) {
        map.current.off('moveend', updateVisibleNeighborhoods);
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update list of visible neighborhoods as map moves
  const updateVisibleNeighborhoods = () => {
    if (!map.current || !neighborhoods.length) return;
    
    const bounds = map.current.getBounds();
    const visible = neighborhoods
      .filter(n => {
        const lat = parseFloat(n.lat);
        const lng = parseFloat(n.lng);
        return !isNaN(lat) && !isNaN(lng) && 
               bounds.contains([lng, lat]);
      })
      .map(n => n.neighborhood);
    
    setVisibleNeighborhoods(visible);
  };

  // Function to clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Function to create a custom marker element
  const createMarkerElement = (neighborhood: Neighborhood) => {
    const el = document.createElement('div');
    el.className = 'neighborhood-marker';
    el.style.width = '15px';
    el.style.height = '15px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6'; // Blue color
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    
    // Add hover effect
    el.onmouseover = () => {
      el.style.backgroundColor = '#2563eb'; // Darker blue on hover
      el.style.transform = 'scale(1.2)';
      el.style.transition = 'all 0.2s ease-in-out';
    };
    
    el.onmouseout = () => {
      el.style.backgroundColor = '#3b82f6';
      el.style.transform = 'scale(1)';
    };
    
    // If this is the selected neighborhood, make it stand out
    if (neighborhood.neighborhood === selectedNeighborhood) {
      el.style.backgroundColor = '#dc2626'; // Red color for selected
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.zIndex = '10';
    }
    
    return el;
  };

  // Filter neighborhoods by city and add markers
  useEffect(() => {
    if (!map.current || isLoading) return;
    
    clearMarkers();
    
    const filteredNeighborhoods = city 
      ? allNeighborhoods.filter(n => n.city_name === city)
      : [];
    
    setNeighborhoods(filteredNeighborhoods);
    
    if (filteredNeighborhoods.length > 0) {
      // Add markers for each neighborhood
      filteredNeighborhoods.forEach(neighborhood => {
        if (neighborhood.lat && neighborhood.lng) {
          const lat = parseFloat(neighborhood.lat);
          const lng = parseFloat(neighborhood.lng);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            const markerElement = createMarkerElement(neighborhood);
            
            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25, closeButton: true })
                  .setHTML(`
                    <div class="p-2">
                      <h3 class="font-bold text-lg">${neighborhood.neighborhood}</h3>
                      <p>${neighborhood.city_name}, ${neighborhood.state_name}</p>
                      <p class="text-sm text-gray-600">ZIP: ${neighborhood.zips || 'N/A'}</p>
                    </div>
                  `)
              )
              .addTo(map.current!);
              
            markersRef.current.push(marker);
            
            marker.getElement().addEventListener('click', () => {
              setSelectedNeighborhood(neighborhood.neighborhood);
            });
          }
        }
      });
      
      // Fit map to markers
      if (filteredNeighborhoods.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        filteredNeighborhoods.forEach(neighborhood => {
          const lat = parseFloat(neighborhood.lat);
          const lng = parseFloat(neighborhood.lng);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lng, lat]);
          }
        });
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14
        });
        
        // Update visible neighborhoods after bounds change
        setTimeout(updateVisibleNeighborhoods, 300);
      }
    }
  }, [city, allNeighborhoods, isLoading, selectedNeighborhood]);

  // Handle city selection
  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = event.target.value;
    setCity(selectedCity);
    setSelectedNeighborhood(null);
  };

  // Handle neighborhood selection from the sidebar
  const handleNeighborhoodClick = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood.neighborhood);
    
    if (map.current) {
      map.current.flyTo({
        center: [parseFloat(neighborhood.lng), parseFloat(neighborhood.lat)],
        zoom: 15,
        essential: true
      });
      
      // Re-render markers to highlight the selected one
      clearMarkers();
      neighborhoods.forEach(n => {
        if (n.lat && n.lng) {
          const lat = parseFloat(n.lat);
          const lng = parseFloat(n.lng);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            const markerElement = createMarkerElement(n);
            
            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-2">
                      <h3 class="font-bold text-lg">${n.neighborhood}</h3>
                      <p>${n.city_name}, ${n.state_name}</p>
                      <p class="text-sm text-gray-600">ZIP: ${n.zips || 'N/A'}</p>
                    </div>
                  `)
              )
              .addTo(map.current!);
              
            markersRef.current.push(marker);
            
            // Open popup for selected neighborhood
            if (n.neighborhood === neighborhood.neighborhood) {
              marker.togglePopup();
            }
          }
        }
      });
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select a city:
          </label>
          <select 
            id="city-select"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={handleCityChange}
            value={city}
            disabled={isLoading}
          >
            <option value="">Select a City</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full">
          <p className="text-sm text-gray-600">
            {isLoading 
              ? 'Loading neighborhoods...' 
              : city 
                ? `Showing ${neighborhoods.length} neighborhoods in ${city}` 
                : 'Select a city to view neighborhoods'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Map Container */}
        <div className="w-full md:w-3/4">
          <div ref={mapContainer} className="w-full h-96 md:h-120 rounded-lg shadow" />
        </div>
        
        {/* Sidebar */}
        {city && (
          <div className="w-full md:w-1/4 border rounded-lg shadow p-4 max-h-96 md:max-h-120 overflow-y-auto">
            <h3 className="font-bold text-lg mb-2">Neighborhoods in {city}</h3>
            {neighborhoods.length === 0 ? (
              <p>No neighborhoods found</p>
            ) : (
              <ul className="space-y-1">
                {neighborhoods.map((n) => (
                  <li 
                    key={n.id} 
                    className={`p-2 rounded cursor-pointer hover:bg-blue-50 ${
                      selectedNeighborhood === n.neighborhood ? 'bg-blue-100 font-medium' : ''
                    } ${
                      visibleNeighborhoods.includes(n.neighborhood) ? 'border-l-4 border-blue-500 pl-2' : ''
                    }`}
                    onClick={() => handleNeighborhoodClick(n)}
                  >
                    {n.neighborhood}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {selectedNeighborhood && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium">Selected Neighborhood: {selectedNeighborhood}</h3>
          {city && <p className="text-sm text-gray-600">City: {city}</p>}
          
          {/* Display additional neighborhood details */}
          {neighborhoods.find(n => n.neighborhood === selectedNeighborhood) && (
            <div className="mt-2 text-sm">
              <p>
                <span className="font-medium">State:</span> {
                  neighborhoods.find(n => n.neighborhood === selectedNeighborhood)?.state_name
                }
              </p>
              <p>
                <span className="font-medium">ZIP Codes:</span> {
                  neighborhoods.find(n => n.neighborhood === selectedNeighborhood)?.zips || 'N/A'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}