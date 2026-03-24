import { CourseCard } from "../../components/ui/CourseCard";

export default function MyCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          My Courses
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Continue learning where you left off.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {["All (3)", "In Progress (2)", "Completed (1)", "Expired (0)"].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              i === 0 
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" 
                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-hover)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <CourseCard
          id="course-1"
          title="HSC 2025 Physics Complete Course"
          slug="hsc-2025-physics"
          thumbnail="https://picsum.photos/seed/course1/640/360"
          category="HSC"
          lessonsCount={120}
          duration="45 Hours"
          price={1500}
          enrolledCount={2500}
          isEnrolled={true}
          progress={45}
        />
        <CourseCard
          id="course-2"
          title="Varsity Admission Math"
          slug="varsity-math"
          thumbnail="https://picsum.photos/seed/course2/640/360"
          category="Varsity Admission"
          lessonsCount={80}
          duration="30 Hours"
          price={2000}
          enrolledCount={1500}
          isEnrolled={true}
          progress={12}
        />
        <CourseCard
          id="course-3"
          title="Medical Admission Biology"
          slug="medical-biology"
          thumbnail="https://picsum.photos/seed/course3/640/360"
          category="Medical"
          lessonsCount={150}
          duration="60 Hours"
          price={2500}
          enrolledCount={3000}
          isEnrolled={true}
          progress={100}
        />
      </div>
    </div>
  );
}
