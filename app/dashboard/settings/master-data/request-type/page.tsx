import React from 'react';
import RequestTypeClient from './RequestTypeClient';
import { getRequestTypes } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function RequestTypeMasterPage() {
  const response = await getRequestTypes();
  const data = response.success && response.data ? response.data : [];

  return <RequestTypeClient initialData={data} />;
}
