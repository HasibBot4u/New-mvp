import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

export interface CourseCardProps {
  key?: React.Key;
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  lessonsCount: number;
  duration: string;
  price: number;
  enrolledCount: number;
  progress?: number;
  isEnrolled?: boolean;
}

export function CourseCard({
  id,
  title,
  slug,
  thumbnail,
  category,
  lessonsCount,
  duration,
  price,
  enrolledCount,
  progress,
  isEnrolled,
}: CourseCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-hover)] transition-shadow flex flex-col h-full border border-[var(--color-border)]">
      <div className="aspect-video bg-[var(--color-primary-pale)] relative overflow-hidden">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
            No Thumbnail
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-xs font-semibold px-2 py-1 rounded">
          {category}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-[var(--color-text)] line-clamp-2 mb-2 min-h-[40px]">
          {title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-4">
          <span>{lessonsCount} Lessons</span>
          <span>{duration}</span>
        </div>

        {isEnrolled && progress !== undefined ? (
          <div className="mb-4">
            <div className="w-full bg-[var(--color-bg)] rounded-full h-2 mb-1">
              <div 
                className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] text-right">
              {progress}% Completed
            </p>
          </div>
        ) : (
          <div className="mb-4 text-xs text-[var(--color-text-muted)]">
            {enrolledCount.toLocaleString()} Students Enrolled
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <div className="font-bold text-lg text-[var(--color-text)]">
            {isEnrolled ? (
              <span className="text-[var(--color-success)] text-sm">Enrolled</span>
            ) : price === 0 ? (
              "Free"
            ) : (
              `৳ ${price}`
            )}
          </div>
          <Link to={isEnrolled ? `/course/${slug}` : `/courses/${slug}`}>
            <Button size="sm" variant={isEnrolled ? "primary" : "danger"}>
              {isEnrolled ? "Continue" : "Enroll Now"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
