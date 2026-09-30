export const dynamic = "force-dynamic";
import { getPipelineStages } from "@/app/actions/master-data";
import SLAClient from "./SLAClient";
import { MasterPipelineStage } from "@prisma/client";

export const metadata = {
  title: "SLA Configuration - Master Data",
};

export default async function SLAPage() {
  const result = await getPipelineStages();
  const initialData: MasterPipelineStage[] = result.success && result.data ? result.data : [];

  return <SLAClient initialData={
initialData} />;
}
