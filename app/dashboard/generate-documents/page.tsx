export const dynamic = "force-dynamic";

import React from "react";
import { getDocumentGenerationData } from "@/app/actions/document";
import GenerateDocumentsClient from "./GenerateDocumentsClient";

export default async function GenerateDocumentsPage() {
  const result = await getDocumentGenerationData();

  const initialData = result.success
    ? {
        jobs: result.jobs || [],
        applications: result.applications || [],
        customers: result.customers || [],
        sites: result.sites || [],
        stages: result.stages || [],
        clinics: result.clinics || [],
        provinces: result.provinces || [],
      }
    : {
        jobs: [],
        applications: [],
        customers: [],
        sites: [],
        stages: [],
        clinics: [],
        provinces: [],
      };

  return (
    <GenerateDocumentsClient
      initialData={initialData}
      initialError={result.success ? undefined : result.error}
    />
  );
}
