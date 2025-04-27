// components/NeighborhoodModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { parse } from 'papaparse';

interface Neighborhood {
  neighborhood: string;
  lat: string;
  lng: string;
  city_name: string;
  id: string;
}

interface ModalProps {
  city: string;
  initialSelected: string[];
  onSave: (neighborhoods: string[]) => void;
  onClose: () => void;
}

export default function NeighborhoodModal({
  city,
  initialSelected,
  onSave,
  onClose,
}: ModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [all, setAll] = useState<Neighborhood[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  // load CSV
  useEffect(() => {
    fetch('/data/usneighborhoods.csv')
      .then(r => r.text())
      .then(csv =>
        parse<Neighborhood>(csv, {
          header: true,
          complete: ({ data }) =>
            setAll(
              data.filter(
                n =>
                  n.city_name === city &&
                  n.neighborhood &&
                  n.lat &&
                  n.lng
              )
            ),
        })
      )
      .catch(console.error);
  }, [city]);

  // init map once data is loaded
  useEffect(() => {
    if (!mapContainer.current || all.length === 0) return;
    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [
        parseFloat(all[0].lng),
        parseFloat(all[0].lat),
      ],
      zoom: 11,
    });

    map.current.on('load', () => {
      // add the geojson source
      map.current!.addSource('neighborhoods', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: all.map(n => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(n.lng), parseFloat(n.lat)],
            },
            properties: { neighborhood: n.neighborhood },
          })),
        },
      });

      // circle layer
      map.current!.addLayer({
        id: 'neighborhood-points',
        type: 'circle',
        source: 'neighborhoods',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'case',
            ['in', ['get', 'neighborhood'], ['literal', selected]],
            '#f59e0b', // orange if selected
            '#3b82f6', // blue otherwise
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // **NEW** symbol layer for labels
      map.current!.addLayer({
        id: 'neighborhood-labels',
        type: 'symbol',
        source: 'neighborhoods',
        layout: {
          'text-field': ['get', 'neighborhood'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 1.2],       // push the label down under the dot
          'text-anchor': 'top',          // anchor at top so offset moves label downward
        },
        paint: {
          'text-color': '#111827',
        },
      });

      // click to select/deselect neighborhoods
      map.current!.on('click', 'neighborhood-points', e => {
        const name = (e.features![0].properties! as any).neighborhood;
        setSelected(cur =>
          cur.includes(name) ? cur.filter(x => x !== name) : [...cur, name]
        );
      });
    });
  }, [all]);

  // update circle colors when selection changes
  useEffect(() => {
    if (!map.current) return;
    map.current.setPaintProperty('neighborhood-points', 'circle-color', [
      'case',
      ['in', ['get', 'neighborhood'], ['literal', selected]],
      '#f59e0b',
      '#3b82f6',
    ]);
  }, [selected]);

  // clicking outside warns if unsaved changes
  const handleBackdropClick = () => {
    const changed =
      initialSelected.length !== selected.length ||
      initialSelected.some(n => !selected.includes(n));
    if (!changed || confirm('Discard changes and close?')) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex-none">
          <h2 className="text-xl font-semibold">
            Select Neighborhoods in {city}
          </h2>
        </div>

        {/* Map */}
        <div
          ref={mapContainer}
          className="flex-auto overflow-auto"
        />

        {/* Footer */}
        <div className="px-6 py-4 flex-none flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
