import React from 'react';
import ClinicClient from './ClinicClient';
import { getClinics, getProvinces } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function ClinicMasterPage() {
  const [clinicsRes, provincesRes] = await Promise.all([
    getClinics(),
    getProvinces()
  ]);

  const clinics = clinicsRes.success && clinicsRes.data ? clinicsRes.data : [];
  const provinces = provincesRes.success && provincesRes.data ? provincesRes.data : [];

  return <ClinicClient initialData={clinics as any} provinces={provinces} />;
}
