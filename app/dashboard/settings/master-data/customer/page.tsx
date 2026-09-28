import React from 'react';
import CustomerClient from './CustomerClient';
import { getCustomers } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function CustomerMasterPage() {
  const response = await getCustomers();
  const data = response.success && response.data ? response.data : [];

  return <CustomerClient initialData={data} />;
}
