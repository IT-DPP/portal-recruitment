import React from 'react';
import SiteClient from './SiteClient';
import { getSites, getCustomers, getProvinces, getCities, getPipelineStages } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function SiteMasterPage() {
  const [sitesRes, customersRes, provincesRes, citiesRes, stagesRes] = await Promise.all([
    getSites(),
    getCustomers(),
    getProvinces(),
    getCities(),
    getPipelineStages()
  ]);

  return (
    <SiteClient 
      initialData={sitesRes.success && sitesRes.data ? (sitesRes.data as any) : []} 
      customers={customersRes.success && customersRes.data ? customersRes.data : []}
      provinces={provincesRes.success && provincesRes.data ? provincesRes.data : []}
      cities={citiesRes.success && citiesRes.data ? citiesRes.data : []}
      stages={stagesRes.success && stagesRes.data ? stagesRes.data : []}
    />
  );
}
