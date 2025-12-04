import React, { useEffect, useRef } from 'react';
import { EventItem } from '../types';

// Declare Leaflet global
declare const L: any;

interface MapViewProps {
  events: EventItem[];
}

export const MapView: React.FC<MapViewProps> = ({ events }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || events.length === 0) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      // Default view; will be overridden by fitBounds
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([0, 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing layers (except tiles)
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const markers: any[] = [];

    // Custom Icon for Pins
    const createIcon = (color: string) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            popupAnchor: [0, -6]
        });
    };

    const validEvents = events.filter(e => e.coordinates?.lat && e.coordinates?.lng);

    validEvents.forEach(event => {
      if (!event.coordinates) return;
      
      let markerColor = '#6366f1'; // Default Indigo
      if (event.recommendationLevel === 'Highly Recommended') markerColor = '#22c55e'; // Green
      if (event.recommendationLevel === 'Consider') markerColor = '#eab308'; // Yellow
      if (event.recommendationLevel === 'Not Recommended') markerColor = '#ef4444'; // Red

      const marker = L.marker([event.coordinates.lat, event.coordinates.lng], {
          icon: createIcon(markerColor)
      })
      .addTo(map)
      .bindPopup(`
        <div class="font-sans text-sm">
          <strong class="block text-indigo-600 mb-1">${event.title}</strong>
          <span class="text-xs text-gray-600">${event.location}</span>
          <br/>
          <span class="text-xs font-semibold mt-1 inline-block px-1.5 py-0.5 rounded ${
            event.recommendationLevel === 'Highly Recommended' ? 'bg-green-100 text-green-700' : 
            event.recommendationLevel === 'Consider' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
          }">${event.recommendationLevel}</span>
        </div>
      `);
      
      markers.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // Cleanup not strictly necessary for singleton ref in this simple case, 
    // but good practice if component unmounts fully.
    return () => {
       // We keep the map instance alive for performance if switching tabs,
       // or we could destroy it here. Let's not destroy it to keep state if user toggles quickly.
    };
  }, [events]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-sm border border-gray-100 z-0">
       <div ref={mapContainerRef} className="w-full h-full" />
       {events.filter(e => e.coordinates).length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[1000]">
           <p className="text-gray-500">No location data available for these events.</p>
         </div>
       )}
    </div>
  );
};