import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import PublicJobList from "@/components/PublicJobList";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-bright font-sans">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12  bg-primary rounded-md p-1 flex items-center justify-center overflow-hidden">
              <Image
                src="/icon.png"
                alt="Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary leading-tight">
                DPP Portal Career
              </h1>
              <p className="text-xs text-on-surface-variant font-medium">
                Discover Your Next Journey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all duration-300 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          </div>
        </header>

        <main className="flex flex-col items-center">
          <div className="text-center mb-12 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 tracking-tight">
              Find the perfect job for <span className="text-primary">you</span>
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Explore open opportunities, find your next career move, and join
              our team of passionate professionals building the future.
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
