import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { CourseCard } from "../../components/ui/CourseCard";

export default function CourseCatalogPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Public Topbar */}
      <header className="h-[64px] bg-[var(--color-primary)] text-white shadow-[var(--shadow-topbar)] flex items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-[var(--color-primary)]">
            A
          </div>
          <span className="font-bold text-lg">Apar's Classroom</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">
            Explore Our Courses
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Join 1,000,000+ students learning with Bangladesh's #1 EdTech platform.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {["All", "HSC", "Varsity Admission", "Medical", "BUET", "Skills"].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <CourseCard
              key={i}
              id={`course-${i}`}
              title={`HSC 2025 Physics Complete Course (Bangla) - Part ${i}`}
              slug={`hsc-2025-physics-${i}`}
              thumbnail={`https://picsum.photos/seed/course${i}/640/360`}
              category="HSC"
              lessonsCount={120}
              duration="45 Hours"
              price={1500}
              enrolledCount={2500}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
