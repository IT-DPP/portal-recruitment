import Link from 'next/link';
import { UserPlus, Briefcase } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-bright p-8 font-sans">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-primary">UGZ Portal Career</h1>
        </div>
        <Link 
          href="/login" 
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-container transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Recruiter Login
        </Link>
      </header>

      <main className="max-w-4xl mx-auto bg-surface-container-lowest border border-table-border rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-2xl font-bold text-on-surface mb-4">Welcome to UGZ Portal Career</h2>
        <p className="text-on-surface-variant mb-8">
          This is the public-facing job portal where candidates can view job openings and apply.
        </p>
        <div className="p-8 border-2 border-dashed border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant">
          Job Openings will be displayed here...
        </div>
      </main>
    </div>
  );
}
