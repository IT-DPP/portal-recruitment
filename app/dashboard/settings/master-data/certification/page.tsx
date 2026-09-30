import React from 'react';
import CertificationClient from './CertificationClient';
import { getCertifications } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function CertificationMasterPage() {
  const response = await getCertifications();
  const data = response.success && response.data ? response.data : [];

  return <CertificationClient initialData={
data} />;
}
