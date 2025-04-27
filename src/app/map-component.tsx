'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  city_name: string;
  lat: string;
  lng: string;
  // …other fields omitted
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  neighborhoods: string[];
}

export default function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map>(); 
  const popupRef = useRef<mapboxgl.Popup>();

  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // 1) Load CSV & Users on mount
  useEffect(() => {
    (async () => {
      // CSV
      const csvText = await (await fetch('/data/usneighborhoods.csv')).text();
      parse<Neighborhood>(csvText, {
        header: true,
        complete: ({ data }) => {
          const valid = data.filter(n => n.neighborhood && n.lat && n.lng);
          setAllNeighborhoods(valid);
          setCities(Array.from(new Set(valid.map(n => n.city_name))).sort());
        },
      });
      // Users
      const usersRes = await fetch('/api/users');
      setUsers(await usersRes.json());
    })();
  }, []);

  // 2) Init map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-95.7129, 37.0902], // USA center
      zoom: 3,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // when style & sources are ready, draw pins
    mapRef.current.on('load', () => {
      updateUserPins();
    });
  }, []);

  // 3) Whenever users, CSV or city filter changes, re-draw
  useEffect(() => {
    if (!mapRef.current?.loaded()) return;
    updateUserPins();
  }, [users, allNeighborhoods, selectedCity]);

  // Utility: remove old layer/source, add new GeoJSON
  function updateUserPins() {
    const map = mapRef.current!;
    // clear old
    if (map.getLayer('user-points')) {
      map.removeLayer('user-points');
    }
    if (map.getSource('users')) {
      map.removeSource('users');
    }

    // build features
    // build features for ALL users, regardless of selectedCity
    const locCount = new Map<string, number>();
    const features = users.map(u => {
        const firstN = u.neighborhoods?.[0];
        const match = allNeighborhoods.find(
          n => n.city_name === u.city && n.neighborhood === firstN
        );
        if (!match) return null;
        const lng = parseFloat(match.lng);
        const lat = parseFloat(match.lat);
        const key = `${lng},${lat}`;
        const count = locCount.get(key) || 0;
        locCount.set(key, count + 1);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng + count * 0.005, lat + count * 0.005],
          },
          properties: {
            name: `${u.first_name} ${u.last_name}`,
            profileUrl: `/user/${u.email.split('@')[0]}`,
          },
        };
      }).filter(Boolean) as GeoJSON.Feature[];

    // add source + layer
    map.addSource('users', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });
    map.addLayer({
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

    // popups & click
    map.on('mouseenter', 'user-points', e => {
      map.getCanvas().style.cursor = 'pointer';
      const feat = e.features?.[0];
      if (feat) {
        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setLngLat((feat.geometry as any).coordinates)
          .setHTML(`<strong>${feat.properties!.name}</strong>`)
          .addTo(map);
      }
    });
    map.on('mouseleave', 'user-points', () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
      popupRef.current = undefined;
    });
    map.on('click', 'user-points', e => {
      const feat = e.features?.[0];
      if (feat && feat.properties!.profileUrl) {
        window.location.href = feat.properties!.profileUrl as string;
      }
    });

    // adjust viewport
    if (features.length) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(f => bounds.extend((f.geometry as any).coordinates));
      map.fitBounds(bounds, { padding: 50, maxZoom: selectedCity ? 14 : 5 });
    }
  }

  // finally: if they picked a city, zoom _to that city’s bounds_
  if (selectedCity) {
      const cityBounds = new mapboxgl.LngLatBounds();
      allNeighborhoods
        .filter(n => n.city_name === selectedCity)
        .forEach(n => {
          const lat = parseFloat(n.lat);
          const lng = parseFloat(n.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            cityBounds.extend([lng, lat]);
          }
        });
      if (!cityBounds.isEmpty()) {
        // use mapRef.current here
        mapRef.current!.fitBounds(cityBounds, { padding: 50, maxZoom: 14 });
      }
  }

  return (
    <div className="relative w-full h-[80vh]">
      {/* City selector, always visible */}
      <div className="absolute top-4 left-4 z-10">
        <select
          className="border border-gray-300 p-2 rounded-md bg-white"
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
        >
          <option value="">All Cities</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow" />
    </div>
  );
}
