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

// Test users hardcoded for Boston
const testUsers = [
  {
    id: '1',
    name: 'Alice',
    neighborhood: 'Back Bay',
    profileUrl: '/profile/alice',
  },
  {
    id: '2',
    name: 'Bob',
    neighborhood: 'Beacon Hill',
    profileUrl: '/profile/bob',
  },
  {
    id: '3',
    name: 'Charlie',
    neighborhood: 'South End',
    profileUrl: '/profile/charlie',
  },
];

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

            const uniqueCities = Array.from(
              new Set(validData.map(item => item.city_name))
            ).filter(Boolean).sort();

            setCities(uniqueCities);
            setIsLoading(false);
          },
          error: (error: e) => {
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
      center: [-95.7129, 37.0902],
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update neighborhoods and users when city changes
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Clear user layer if changing away from Boston
    if (map.current.getSource('users') && city !== 'Boston') {
      if (map.current.getLayer('user-points')) {
        map.current.removeLayer('user-points');
      }
      map.current.removeSource('users');
    }

    const filteredNeighborhoods = city
      ? allNeighborhoods.filter(n => n.city_name === city)
      : [];

    setNeighborhoods(filteredNeighborhoods);

    const neighborhoodFeatures = filteredNeighborhoods.map(n => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(n.lng), parseFloat(n.lat)],
      },
      properties: {
        neighborhood: n.neighborhood,
        city: n.city_name,
        state: n.state_name,
        zip: n.zips,
      },
    }));

    if (map.current.getSource('neighborhoods')) {
      (map.current.getSource('neighborhoods') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: neighborhoodFeatures,
      });
    } else {
      map.current.addSource('neighborhoods', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: neighborhoodFeatures,
        },
      });

      map.current.addLayer({
        id: 'neighborhood-points',
        type: 'circle',
        source: 'neighborhoods',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.current.addLayer({
        id: 'neighborhood-labels',
        type: 'symbol',
        source: 'neighborhoods',
        layout: {
          'text-field': ['get', 'neighborhood'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': 12,
        },
        paint: {
          'text-color': '#111827',
        },
      });

      map.current.on('click', 'neighborhood-points', (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const { neighborhood } = feature.properties as any;
          setSelectedNeighborhood(neighborhood);
        }
      });

      map.current.on('mouseenter', 'neighborhood-points', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'neighborhood-points', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    }

    // If Boston, also add users
    if (city === 'Boston') {
      const bostonNeighborhoods = allNeighborhoods.filter(n => n.city_name === 'Boston');

      const userFeatures = testUsers.map(user => {
        const match = bostonNeighborhoods.find(n => n.neighborhood === user.neighborhood);
        if (!match) return null;
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(match.lng), parseFloat(match.lat)],
          },
          properties: {
            userId: user.id,
            name: user.name,
            profileUrl: user.profileUrl,
          },
        };
      }).filter(Boolean);

      if (map.current.getSource('users')) {
        (map.current.getSource('users') as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: userFeatures as any,
        });
      } else {
        map.current.addSource('users', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: userFeatures as any,
          },
        });

        map.current.addLayer({
          id: 'user-points',
          type: 'circle',
          source: 'users',
          paint: {
            'circle-radius': 8,
            'circle-color': '#dc2626', // Red
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.current.on('click', 'user-points', (e) => {
          const feature = e.features?.[0];
          if (feature) {
            const { profileUrl } = feature.properties as any;
            if (profileUrl) {
              window.location.href = profileUrl;
            }
          }
        });

        map.current.on('mouseenter', 'user-points', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'user-points', () => {
          map.current!.getCanvas().style.cursor = '';
        });
      }
    }

    // Fit bounds
    if (filteredNeighborhoods.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredNeighborhoods.forEach(n => {
        const lat = parseFloat(n.lat);
        const lng = parseFloat(n.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lng, lat]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
      });
    }
  }, [city, allNeighborhoods, isLoading]);

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = event.target.value;
    setCity(selectedCity);
    setSelectedNeighborhood(null);
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
        <div className="w-full md:w-3/4">
          <div ref={mapContainer} className="w-full h-96 md:h-120 rounded-lg shadow" />
        </div>

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
                    }`}
                    onClick={() => setSelectedNeighborhood(n.neighborhood)}
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
