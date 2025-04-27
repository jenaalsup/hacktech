'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { parse } from 'papaparse';

const pastelOranges = [
  'bg-orange-300',
  'bg-orange-400',
  'bg-orange-400',
  'bg-orange-400',
  'bg-orange-500',
];

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
  neighborhoods: string[];
}

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            const uniqueCities = Array.from(new Set(validData.map(n => n.city_name)))
              .filter(Boolean)
              .sort();
            setCities(uniqueCities);
            setIsLoading(false);
          },
          error: (err) => {
            console.error('Error parsing CSV', err);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV', error);
        setIsLoading(false);
      }
    }

    async function loadUsers() {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }

    loadCSVData();
    loadUsers();
  }, []);

  useEffect(() => {
    if (!city || map.current || !mapContainer.current) return;

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
  }, [city]);

  useEffect(() => {
    if (!map.current || isLoading || !city) return;

    map.current.once('load', () => {
      if (map.current!.getSource('users')) {
        if (map.current!.getLayer('user-points')) {
          map.current!.removeLayer('user-points');
        }
        map.current!.removeSource('users');
      }

      const cityNeighborhoods = allNeighborhoods.filter(n => n.city_name === city);

      const locationCount = new Map<string, number>();

      const userFeatures = (Array.isArray(users) ? users : []).map(user => {
        const firstNeighborhood = user.neighborhoods?.[0];
        const match = cityNeighborhoods.find(n => n.neighborhood === firstNeighborhood);
        if (!match) return null;
        const username = user.email.split('@')[0];

        const lng = parseFloat(match.lng);
        const lat = parseFloat(match.lat);

        const key = `${lng},${lat}`;
        const count = locationCount.get(key) || 0;
        locationCount.set(key, count + 1);

        const offsetLng = lng + (count * 0.005);
        const offsetLat = lat + (count * 0.005);

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [offsetLng, offsetLat] },
          properties: {
            name: `${user.first_name} ${user.last_name}`,
            profileUrl: `/user/${username}`,
          },
        };
      }).filter(Boolean);

      if (userFeatures.length > 0) {
        map.current!.addSource('users', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: userFeatures as any,
          },
        });

        map.current!.addLayer({
          id: 'user-points',
          type: 'circle',
          source: 'users',
          paint: {
            'circle-radius': 8,
            'circle-color': '#dc2626',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-allow-overlap': true,
          },
          layout: {
            'visibility': 'visible',
          },
        });

        map.current!.on('mouseenter', 'user-points', (e) => {
          map.current!.getCanvas().style.cursor = 'pointer';

          const feature = e.features?.[0];
          if (feature) {
            const { name } = feature.properties as any;
            if (name) {
              if (popupRef.current) {
                popupRef.current.remove();
              }
              popupRef.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
              })
                .setLngLat((feature.geometry as any).coordinates)
                .setHTML(`<div style="font-size: 14px; font-weight: 600;">${name}</div>`)
                .addTo(map.current!);
            }
          }
        });

        map.current!.on('mouseleave', 'user-points', () => {
          map.current!.getCanvas().style.cursor = '';
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        });

        map.current!.on('click', 'user-points', (e) => {
          const feature = e.features?.[0];
          if (feature) {
            const { profileUrl } = feature.properties as any;
            if (profileUrl) {
              window.location.href = profileUrl;
            }
          }
        });
      }

      if (cityNeighborhoods.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        cityNeighborhoods.forEach(n => {
          const lat = parseFloat(n.lat);
          const lng = parseFloat(n.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lng, lat]);
          }
        });
        map.current!.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    });
  }, [city, allNeighborhoods, isLoading, users]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  return (
    <div className={`flex flex-col items-center ${!city ? 'min-h-screen justify-start pt-20' : 'space-y-4'}`}>
      
      {/* No city selected — show orange bubbles */}
      {!city && (
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-xl font-semibold text-gray-700 mt-4">
            Select a city to view Caltech students in that city!
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl px-4">
            {cities.map((cityName, idx) => (
              <button
                key={cityName}
                onClick={() => setCity(cityName)}
                className={`min-w-[90px] text-center px-4 py-2 ${pastelOranges[idx % pastelOranges.length]} text-white rounded-full hover:brightness-110 text-base shadow transition`}
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City selected — show dropdown and map */}
      {city && (
        <div className="flex flex-col w-full px-4">
          {/* Dropdown always visible when city is selected */}
          <div className="flex justify-start mb-4">
            <select
              id="city-select"
              className="border border-gray-300 p-2 rounded-md w-64"
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

          {/* Map */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-3/4">
              <div ref={mapContainer} className="w-full h-96 md:h-120 rounded-lg shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
