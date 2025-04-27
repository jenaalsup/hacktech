// src/app/map-component.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { parse } from 'papaparse';

interface Neighborhood {
  neighborhood: string;
  city_name: string;
  lat: string;
  lng: string;
}

interface CityRow {
  city_name: string;
  state_id: string;
  lat: string;
  lng: string;
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
  const [allCities, setAllCities] = useState<CityRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // 1) Load CSVs + users
  useEffect(() => {
    (async () => {
      // neighborhoods CSV
      const nbText = await fetch('/data/usneighborhoods.csv').then(r => r.text());
      parse<Neighborhood>(nbText, {
        header: true,
        complete: ({ data }) =>
          setAllNeighborhoods(
            data.filter(n => n.city_name && n.neighborhood && n.lat && n.lng)
          ),
      });

      // cities CSV
      const ctText = await fetch('/data/uscities.csv').then(r => r.text());
      parse<CityRow>(ctText, {
        header: true,
        complete: ({ data }) =>
          setAllCities(
            data.filter(c => c.city_name && c.lat && c.lng)
          ),
      });

      // users API
      const us = await fetch('/api/users').then(r => r.json());
      setUsers(us);
    })();
  }, []);

  // 2) Init Mapbox
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-95.7129, 37.0902],
      zoom: 3,
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.on('load', () => updateUserPins());
    mapRef.current = map;
  }, []);

  // 3) Re-draw whenever data or selection changes
  useEffect(() => {
    if (!mapRef.current?.loaded()) return;
    // rebuild dropdown of cities that users actually live in
    setCities(Array.from(new Set(users.map(u => u.city))).sort());
    updateUserPins();
  }, [users, allNeighborhoods, allCities, selectedCity]);

  function updateUserPins() {
    const map = mapRef.current!;
    // remove old
    if (map.getLayer('user-points')) map.removeLayer('user-points');
    if (map.getSource('users')) map.removeSource('users');

    // build GeoJSON features
    const locCount = new Map<string, number>();
    const features = users
      .map(u => {
        let lat: number, lng: number;

        // 1) try neighborhood
        const firstN = u.neighborhoods?.[0];
        const nb = allNeighborhoods.find(
          n => n.city_name === u.city && n.neighborhood === firstN
        );
        if (nb) {
          lat = parseFloat(nb.lat);
          lng = parseFloat(nb.lng);
        } else {
          // 2) fallback: city center
          const city = allCities.find(c => c.city_name === u.city);
          if (!city) return null;
          lat = parseFloat(city.lat);
          lng = parseFloat(city.lng);
        }

        // offset overlapping pins
        const key = `${lat},${lng}`;
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
      })
      .filter(Boolean) as GeoJSON.Feature[];

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
      const f = e.features?.[0];
      if (f) {
        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setLngLat((f.geometry as any).coordinates)
          .setHTML(`<strong>${f.properties?.name}</strong>`)
          .addTo(map);
      }
    });
    map.on('mouseleave', 'user-points', () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
      popupRef.current = undefined;
    });
    map.on('click', 'user-points', e => {
      const f = e.features?.[0];
      if (f?.properties?.profileUrl) {
        window.location.href = f.properties.profileUrl;
      }
    });

    // viewport: either fit all pins, or zoom to selected city
    if (selectedCity) {
      // try neighborhood bounds
      const bounds = new mapboxgl.LngLatBounds();
      allNeighborhoods
        .filter(n => n.city_name === selectedCity)
        .forEach(n =>
          bounds.extend([parseFloat(n.lng), parseFloat(n.lat)])
        );
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      } else {
        // fallback: center on city
        const city = allCities.find(c => c.city_name === selectedCity);
        if (city) {
          map.flyTo({
            center: [parseFloat(city.lng), parseFloat(city.lat)],
            zoom: 12,
          });
        }
      }
    } else if (features.length) {
      const allBounds = new mapboxgl.LngLatBounds();
      features.forEach(f =>
        allBounds.extend((f.geometry as any).coordinates)
      );
      map.fitBounds(allBounds, { padding: 50, maxZoom: 5 });
    }
  }

  return (
    <div className="relative w-full h-[80vh]">
      <div className="absolute top-4 left-4 z-10">
        <select
          className="border border-gray-300 p-2 rounded-md bg-white"
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
        >
          <option value="">All Cities</option>
          {cities.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow" />
    </div>
  );
}
