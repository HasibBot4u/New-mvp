import { useAuthStore } from "../../store/authStore";
import { BookOpen, CheckCircle, Target, Trophy } from "lucide-react";
import { CourseCard } from "../../components/ui/CourseCard";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: "Enrolled Courses", value: "3", icon: BookOpen, color: "var(--color-primary)" },
    { label: "Completed Lessons", value: "42", icon: CheckCircle, color: "var(--color-success)" },
    { label: "Average Quiz Score", value: "85%", icon: Target, color: "var(--color-warning)" },
    { label: "Current Streak", value: "5 Days", icon: Trophy, color: "var(--color-accent)" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          স্বাগতম, {user?.name}! 👋 আজকে কী পড়বেন?
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Welcome back to Apar's Classroom. Here's your learning overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)] flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center opacity-90"
              style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text)]">Enrolled Courses</h2>
              <a href="/my-courses" className="text-sm text-[var(--color-primary-light)] hover:underline">
                See All
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Upcoming Live Classes</h2>
            <div className="space-y-4">
              <div className="border border-[var(--color-border)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-1 bg-[var(--color-primary-pale)] text-[var(--color-primary)] rounded">
                    Physics
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">Today, 8:00 PM</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">Thermodynamics Part 1</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">Apar Vai</p>
                <button className="w-full py-1.5 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-light)] transition-colors">
                  Join Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
