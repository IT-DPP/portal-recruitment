"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface SiteMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stats: {
    accepted: number;
    rejected: number;
    inProcess: number;
  };
}

interface Props {
  markers: SiteMarker[];
}

export default function GeoMapComponent({ markers }: Props) {
  // Center map approximately in the middle of Indonesia
  const center: [number, number] = [-0.7893, 113.9213];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-table-border">
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
            <Popup>
              <div className="p-1 w-48">
                <h4 className="font-bold text-sm mb-2">{marker.name}</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-green-600 font-medium">Diterima</span>
                    <span className="font-bold">{marker.stats.accepted}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-red-600 font-medium">Ditolak</span>
                    <span className="font-bold">{marker.stats.rejected}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-blue-600 font-medium">Dalam Proses</span>
                    <span className="font-bold">{marker.stats.inProcess}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
