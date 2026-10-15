export const dynamic = "force-dynamic";
import { getPublicJobs } from "@/app/actions/job";
import { getProvinces, getDepartments } from "@/app/actions/master-data";
import PublicJobsClient from "./PublicJobsClient";

export const metadata = {
  title: "Lowongan Pekerjaan | E-Recruitment",
  description: "Temukan karir impian Anda bersama kami di E-Recruitment Portal.",
};

export default async function PublicJobsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const province = typeof sp.province === 'string' ? sp.province : undefined;
  const department = typeof sp.department === 'string' ? sp.department : undefined;

  const [jobsRes, provincesRes, deptsRes] = await Promise.all([
    getPublicJobs(q, province, undefined, department),
    getProvinces(),
    getDepartments()
  ]);

  return (
    <div className="min-h-screen bg-surface-container-lowest pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight sm:text-5xl mb-4">Temukan Karir Impianmu</h1>
          <p className="text-lg text-on-surface-variant">
            Bergabunglah dengan tim profesional kami dan kembangkan potensimu di lingkungan kerja yang dinamis.
          </p>
        </div>
        
        <PublicJobsClient 
          initialJobs={jobsRes.success ? (jobsRes.data || []) : []} 
          provinces={provincesRes.success ? (provincesRes.data || []) : []}
          departments={deptsRes.success ? (deptsRes.data || []) : []}
          initialSearch={q}
          initialProvince={province}
          initialDepartment={department}
        />
      </div>
    </div>
  );
}
