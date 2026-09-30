import React from 'react';
import PositionClient from './PositionClient';
import { getPositions } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function PositionMasterPage() {
  const response = await getPositions();
  const data = response.success && response.data ? response.data : [];

  return <PositionClient initialData={
data} />;
}
