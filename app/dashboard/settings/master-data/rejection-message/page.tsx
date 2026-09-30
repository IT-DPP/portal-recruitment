import React from 'react';
import RejectionMessageClient from './RejectionMessageClient';
import { getRejectionMessages, getPipelineStages } from '@/app/actions/master-data';

export const dynamic = 'force-dynamic';

export default async function RejectionMessageMasterPage() {
  const [resMsg, resStages] = await Promise.all([
    getRejectionMessages(),
    getPipelineStages()
  ]);
  
  const data = resMsg.success && resMsg.data ? resMsg.data : [];
  const stages = resStages.success && resStages.data ? resStages.data : [];

  return <RejectionMessageClient initialData={
data} stages={stages} />;
}
