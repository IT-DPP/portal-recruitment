"use client";
import dynamic from 'next/dynamic';
import { SiteMarker } from './GeoMapComponent';

const GeoMapComponent = dynamic(
  () => import('./GeoMapComponent'),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div> }
);

interface Props {
  markers: SiteMarker[];
}

export default function GeoMap({ markers }: Props) {
  return <GeoMapComponent markers={markers} />;
}
