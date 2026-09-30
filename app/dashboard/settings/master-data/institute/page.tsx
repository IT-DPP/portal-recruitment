import React from 'react';
import InstituteClient from './InstituteClient';
import { getInstitutes } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function InstituteMasterPage() {
  const response = await getInstitutes();
  const data = response.success && response.data ? response.data : [];

  return <InstituteClient initialData={
data} />;
}
