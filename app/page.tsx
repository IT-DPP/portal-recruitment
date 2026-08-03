import Link from "next/link";
import { UserPlus, Briefcase } from "lucide-react";
import PublicJobList from "@/components/PublicJobList";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-bright font-sans">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
              <Briefcase className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary leading-tight">DPP Portal Career</h1>
              <p className="text-xs text-on-surface-variant font-medium">Discover Your Next Journey</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all duration-300"
          >
            <UserPlus className="w-4 h-4" />
            Recruiter Login
          </Link>
        </header>

        <main className="flex flex-col items-center">
          <div className="text-center mb-12 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 tracking-tight">
              Find the perfect job for <span className="text-primary">you</span>
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Explore open opportunities, find your next career move, and join our team of passionate professionals building the future.
            </p>
          </div>
          
          <div className="w-full">
            <PublicJobList />
          </div>
        </main>
      </div>
    </div>
  );
}
