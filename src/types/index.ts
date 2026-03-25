// FILE: src/types/index.ts

export interface Video {
  id: string;
  chapter_id: string;
  title: string;
  display_order: number;
  telegram_file_id: string;
  telegram_message_id: number;
  telegram_channel_id: string;
  duration: string;
  size_mb: number;
  is_active: boolean;
}

export interface Chapter {
  id: string;
  cycle_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  videos: Video[];
}

export interface Cycle {
  id: string;
  subject_id: string;
  name: string;
  display_order: number;
  telegram_channel_id: string;
  is_active: boolean;
  chapters: Chapter[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  display_order: number;
  is_active: boolean;
  cycles: Cycle[];
}

export interface Catalog {
  subjects: Subject[];
  total_videos: number;
}

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: 'user' | 'admin';
  is_blocked: boolean;
  is_restricted: boolean;
  last_active_at?: string;
  total_watch_time_minutes?: number;
  videos_watched_count?: number;
  created_at: string;
}
