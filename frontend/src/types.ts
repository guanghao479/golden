import type { Session } from "@supabase/supabase-js";

export type Event = {
  id: string;
  source_url: string | null;
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  website: string | null;
  price: string | null;
  age_range: string | null;
  image_url: string | null;
  tags: string[];
  approved: boolean;
  created_at?: string | null;
};

export type Place = {
  id: string;
  source_url: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  address: string | null;
  website: string | null;
  family_friendly: boolean;
  tags: string[];
  approved: boolean;
  created_at?: string | null;
};

export type EventDraft = {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  website: string;
  price: string;
  age_range: string;
  image_url: string;
  tags: string;
};

export type PlaceDraft = {
  name: string;
  description: string;
  category: string;
  address: string;
  website: string;
  family_friendly: boolean;
  tags: string;
};

export type CrawlJob = {
  id: string;
  firecrawl_job_id: string;
  source_url: string;
  crawl_type: "events" | "places";
  status: "pending" | "completed" | "failed";
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
};

export type AppData = {
  events: Event[];
  places: Place[];
  pendingEvents: Event[];
  pendingPlaces: Place[];
  allCrawlJobs: CrawlJob[];
  pendingCrawlJobs: CrawlJob[];
  crawlUrl: string;
  crawlType: "events" | "places";
  statusMessage: string | null;
  refreshMessage: string | null;
  isSubmitting: boolean;
  isRefreshing: boolean;
  session: Session | null;
  authError: string | null;
  authLoading: boolean;
  setCrawlUrl: (value: string) => void;
  setCrawlType: (value: "events" | "places") => void;
  handleCrawlSubmit: () => void;
  handleRefreshJobs: () => void;
  saveEvent: (id: string, draft: EventDraft) => void;
  savePlace: (id: string, draft: PlaceDraft) => void;
  approveEvent: (id: string) => void;
  approvePlace: (id: string) => void;
  deleteEvent: (id: string) => void;
  deletePlace: (id: string) => void;
  handleSignIn: (email: string, password: string) => void;
  handleSignOut: () => void;
};
