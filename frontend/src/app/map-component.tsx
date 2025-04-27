'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { parse } from 'papaparse';

// Define types
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

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  neighborhoods: string[]; // first neighborhood used
}

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load neighborhood CSV
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
          error: (error: any) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setIsLoading(false);
      }
    }

    async function loadUsers() {
      try {
        const response = await fetch('/api/users'); // Fetch all users
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }

    loadCSVData();
    loadUsers();
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

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when city, neighborhoods, users change
  useEffect(() => {
    if (!map.current || isLoading) return;

    if (map.current.getSource('users')) {
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

    // Now create user points
    const cityNeighborhoods = allNeighborhoods.filter(n => n.city_name === city);

    const userFeatures = users.map(user => {
      const firstNeighborhood = user.neighborhoods?.[0];
      const match = cityNeighborhoods.find(n => n.neighborhood === firstNeighborhood);
      if (!match) return null;

      const username = user.email.split('@')[0];
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(match.lng), parseFloat(match.lat)],
        },
        properties: {
          userId: user._id,
          name: `${user.first_name} ${user.last_name}`,
          profileUrl: `/user/${username}`,
        },
      };
    }).filter(Boolean);

    if (userFeatures.length > 0) {
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
          'circle-color': '#dc2626',
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
  }, [city, allNeighborhoods, isLoading, users]);

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
      </div>
    </div>
  );
}
