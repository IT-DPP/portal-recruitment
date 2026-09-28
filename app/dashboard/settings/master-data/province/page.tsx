import React from 'react';
import ProvinceClient from './ProvinceClient';
import { getProvinces } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function ProvinceMasterPage() {
  const response = await getProvinces();
  const provinces = response.success && response.data ? response.data : [];

  return <ProvinceClient initialData={provinces} />;
}
