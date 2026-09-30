export const dynamic = "force-dynamic";
import { getPublicJobById } from "@/app/actions/job";
import Link from "next/link";
import { ArrowLeft, MapPin, Building2, Calendar, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getPublicJobById(id);
  if (!res.success || !res.data) return { title: "Lowongan Tidak Ditemukan" };
  
  const title = res.data.positionId === "0" ? res.data.positionName : res.data.position?.name;
  return {
    title: `${title} | Recruitment Portal`,
  };
}

export default async function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getPublicJobById(id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const job = res.data;
  const title = job.positionId === "0" ? job.positionName : job.position?.name;

  return (
    <div className="min-h-screen bg-surface-container-lowest pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-table-border overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-table-border bg-surface-container-lowest">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              {job.department?.name || job.departmentName || "General"}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-6">{title}</h1>
            
            <div className="flex flex-wrap gap-4 md:gap-8 text-sm font-medium text-on-surface-variant">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{job.city?.name}, {job.province?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>{job.site?.name || job.customer?.name || "Corporate"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Dipublish: {new Date(job.publishedDate || job.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10 space-y-10">
            {job.kualifikasi && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Persyaratan
                </h2>
                <div className="text-on-surface whitespace-pre-wrap leading-relaxed">
                  {job.kualifikasi}
                </div>
              </section>
            )}

            {job.benefit && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Benefit
                </h2>
                <div className="text-on-surface whitespace-pre-wrap leading-relaxed">
                  {job.benefit}
                </div>
              </section>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-8 border-t border-table-border bg-surface-bright text-center">
            <h3 className="text-lg font-bold text-black mb-2">Tertarik dengan posisi ini?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Silakan login ke akun Anda untuk melamar.</p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors shadow-sm"
            >
              Login & Melamar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
