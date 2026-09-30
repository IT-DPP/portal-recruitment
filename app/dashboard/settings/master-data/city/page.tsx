import React from 'react';
import CityClient from './CityClient';
import { getCities, getProvinces } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function CityMasterPage() {
  const [citiesRes, provincesRes] = await Promise.all([
    getCities(),
    getProvinces()
  ]);

  const cities = citiesRes.success && citiesRes.data ? citiesRes.data : [];
  const provinces = provincesRes.success && provincesRes.data ? provincesRes.data : [];

  return <CityClient initialData={
cities as any} provinces={provinces} />;
}
