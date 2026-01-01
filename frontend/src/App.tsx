import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  useRouterState,
} from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  source_url: string | null;
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  website: string | null;
  tags: string[];
  approved: boolean;
};

type Place = {
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
};

type EventDraft = {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  website: string;
  tags: string;
};

type PlaceDraft = {
  name: string;
  description: string;
  category: string;
  address: string;
  website: string;
  family_friendly: boolean;
  tags: string;
};

type CrawlJob = {
  id: string;
  status: "pending" | "completed" | "failed";
  created_at?: string | null;
};

type AppData = {
  events: Event[];
  places: Place[];
  pendingEvents: Event[];
  pendingPlaces: Place[];
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
  handleSignIn: (email: string, password: string) => void;
  handleSignOut: () => void;
};

const AppDataContext = createContext<AppData | null>(null);

const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataContext");
  }
  return context;
};

const highlights = [
  {
    icon: CalendarDays,
    title: "Family-friendly events",
    description: "Curate weekend festivals, library programs, and seasonal adventures.",
  },
  {
    icon: MapPinned,
    title: "Playful places",
    description: "Discover parks, museums, and indoor play spaces vetted for kids.",
  },
  {
    icon: ShieldCheck,
    title: "Admin approvals",
    description: "Review and polish each listing before it appears in the app.",
  },
];

const navLinkStyles = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

function MarketingPage() {
  return (
    <main className="px-6 pb-16">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Trusted family-ready listings
          </span>
          <h2 className="text-4xl font-semibold leading-tight text-foreground">
            Discover what to do this weekend — curated for kids and caregivers.
          </h2>
          <p className="text-base text-muted-foreground">
            Golden crawls community calendars and attraction sites, then our admin
            team approves each listing before it appears in the mobile-friendly
            directory.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/explore/events">
                <Search className="mr-2 h-4 w-4" /> Explore events
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/explore/places">Browse activity places</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.title} className="border-muted">
                <CardHeader>
                  <item.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="mt-3 text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Why families use Golden</CardTitle>
              <CardDescription>Hand-picked, always ready to go.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                We unify event calendars, park listings, and attraction sites into a
                single feed that is reviewed by our admin team.
              </p>
              <p>
                Browse verified activities, save your favorites, and plan your next
                outing with confidence.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="space-y-3 py-8">
              <h3 className="text-2xl font-semibold">Ready to explore?</h3>
              <p className="text-sm text-primary-foreground/80">
                Connect your Supabase instance and Firecrawl API key to start
                building your curated feed.
              </p>
              <Button asChild variant="outline" className="bg-white/10 text-white">
                <Link to="/admin">Go to admin review</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

type ExplorePageProps = {
  events: Event[];
  places: Place[];
};

function ExplorePage({ events, places }: ExplorePageProps) {
  return (
    <main className="px-6 pb-16">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
            <CardDescription>Approved highlights near you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approved events yet.
              </p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-xl bg-muted px-4 py-3">
                  <p className="font-medium text-foreground">
                    {event.title || "Untitled event"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.start_time || "Time TBD"} ·{" "}
                    {event.location_name || "Location TBD"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Activity places</CardTitle>
            <CardDescription>Always-on family favorites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {places.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approved places yet.
              </p>
            ) : (
              places.map((place) => (
                <div
                  key={place.id}
                  className="rounded-xl border border-muted px-4 py-3"
                >
                  <p className="font-medium text-foreground">
                    {place.name || "Untitled place"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {place.category || "Family-friendly spot"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

type AdminPageProps = {
  pendingEvents: Event[];
  pendingPlaces: Place[];
  pendingCrawlJobs: CrawlJob[];
  crawlUrl: string;
  crawlType: "events" | "places";
  statusMessage: string | null;
  refreshMessage: string | null;
  isSubmitting: boolean;
  isRefreshing: boolean;
  onCrawlUrlChange: (value: string) => void;
  onCrawlTypeChange: (value: "events" | "places") => void;
  onCrawlSubmit: () => void;
  onRefreshJobs: () => void;
  onSaveEvent: (id: string, draft: EventDraft) => void;
  onSavePlace: (id: string, draft: PlaceDraft) => void;
  onApproveEvent: (id: string) => void;
  onApprovePlace: (id: string) => void;
};

type EventReviewCardProps = {
  event: Event;
  onSave: (id: string, draft: EventDraft) => void;
  onApprove: (id: string) => void;
};

function EventReviewCard({ event, onSave, onApprove }: EventReviewCardProps) {
  const form = useForm<EventDraft>({
    defaultValues: {
      title: event.title ?? "",
      description: event.description ?? "",
      start_time: event.start_time ?? "",
      end_time: event.end_time ?? "",
      location_name: event.location_name ?? "",
      address: event.address ?? "",
      website: event.website ?? "",
      tags: event.tags?.join(", ") ?? "",
    },
    onSubmit: async ({ value }) => {
      await onSave(event.id, value);
    },
  });

  useEffect(() => {
    form.reset({
      values: {
        title: event.title ?? "",
        description: event.description ?? "",
        start_time: event.start_time ?? "",
        end_time: event.end_time ?? "",
        location_name: event.location_name ?? "",
        address: event.address ?? "",
        website: event.website ?? "",
        tags: event.tags?.join(", ") ?? "",
      },
    });
  }, [event, form]);

  return (
    <div className="rounded-2xl border border-muted p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <form.Field
              name="title"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Event title"
                />
              )}
            />
            <form.Field
              name="description"
              children={(field) => (
                <Textarea
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Description"
                />
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
            <form.Field
              name="start_time"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Start time"
                />
              )}
            />
            <form.Field
              name="end_time"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="End time"
                />
              )}
            />
            </div>
          </div>
          <div className="space-y-3">
            <form.Field
              name="location_name"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Location"
                />
              )}
            />
            <form.Field
              name="address"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Address"
                />
              )}
            />
            <form.Field
              name="website"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Website"
                />
              )}
            />
            <form.Field
              name="tags"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Tags (comma separated)"
                />
              )}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" type="submit">
            Save edits
          </Button>
          <Button type="button" onClick={() => onApprove(event.id)}>
            Approve event
          </Button>
        </div>
      </form>
    </div>
  );
}

type PlaceReviewCardProps = {
  place: Place;
  onSave: (id: string, draft: PlaceDraft) => void;
  onApprove: (id: string) => void;
};

function PlaceReviewCard({ place, onSave, onApprove }: PlaceReviewCardProps) {
  const form = useForm<PlaceDraft>({
    defaultValues: {
      name: place.name ?? "",
      description: place.description ?? "",
      category: place.category ?? "",
      address: place.address ?? "",
      website: place.website ?? "",
      family_friendly: place.family_friendly ?? false,
      tags: place.tags?.join(", ") ?? "",
    },
    onSubmit: async ({ value }) => {
      await onSave(place.id, value);
    },
  });

  useEffect(() => {
    form.reset({
      values: {
        name: place.name ?? "",
        description: place.description ?? "",
        category: place.category ?? "",
        address: place.address ?? "",
        website: place.website ?? "",
        family_friendly: place.family_friendly ?? false,
        tags: place.tags?.join(", ") ?? "",
      },
    });
  }, [place, form]);

  return (
    <div className="rounded-2xl border border-muted p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <form.Field
              name="name"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Place name"
                />
              )}
            />
            <form.Field
              name="description"
              children={(field) => (
                <Textarea
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Description"
                />
              )}
            />
            <form.Field
              name="category"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Category"
                />
              )}
            />
          </div>
          <div className="space-y-3">
            <form.Field
              name="address"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Address"
                />
              )}
            />
            <form.Field
              name="website"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Website"
                />
              )}
            />
            <form.Field
              name="family_friendly"
              children={(field) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(field.state.value)}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="h-4 w-4 rounded border-muted"
                  />
                  Family-friendly
                </div>
              )}
            />
            <form.Field
              name="tags"
              children={(field) => (
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Tags (comma separated)"
                />
              )}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" type="submit">
            Save edits
          </Button>
          <Button type="button" onClick={() => onApprove(place.id)}>
            Approve place
          </Button>
        </div>
      </form>
    </div>
  );
}

function AdminPage({
  pendingEvents,
  pendingPlaces,
  pendingCrawlJobs,
  crawlUrl,
  crawlType,
  statusMessage,
  refreshMessage,
  isSubmitting,
  isRefreshing,
  onCrawlUrlChange,
  onCrawlTypeChange,
  onCrawlSubmit,
  onRefreshJobs,
  onSaveEvent,
  onSavePlace,
  onApproveEvent,
  onApprovePlace,
}: AdminPageProps) {
  return (
    <main className="px-6 pb-16">
      <section className="mx-auto max-w-6xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Submit a website to crawl</CardTitle>
            <CardDescription>
              Firecrawl will extract structured events or places for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">
                  Website URL
                </label>
                <Input
                  value={crawlUrl}
                  onChange={(event) => onCrawlUrlChange(event.target.value)}
                  placeholder="https://example.com/calendar"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={crawlType === "events" ? "default" : "outline"}
                    onClick={() => onCrawlTypeChange("events")}
                  >
                    Events
                  </Button>
                  <Button
                    variant={crawlType === "places" ? "default" : "outline"}
                    onClick={() => onCrawlTypeChange("places")}
                  >
                    Places
                  </Button>
                </div>
              </div>
              <Button onClick={onCrawlSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Start crawl"}
              </Button>
            </div>
            {statusMessage && (
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Review pending events</CardTitle>
                <CardDescription>
                  Edit the details before approving.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={onRefreshJobs}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingCrawlJobs.length > 0 && (
              <div className="rounded-xl border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                ⏳ {pendingCrawlJobs.length} crawl
                {pendingCrawlJobs.length === 1 ? "" : "s"} in progress...
              </div>
            )}
            {refreshMessage && (
              <p className="text-sm text-muted-foreground">{refreshMessage}</p>
            )}
            {pendingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending events.</p>
            ) : (
              pendingEvents.map((event) => (
                <EventReviewCard
                  key={event.id}
                  event={event}
                  onSave={onSaveEvent}
                  onApprove={onApproveEvent}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review pending places</CardTitle>
            <CardDescription>Confirm the experience before publishing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending places.</p>
            ) : (
              pendingPlaces.map((place) => (
                <PlaceReviewCard
                  key={place.id}
                  place={place}
                  onSave={onSavePlace}
                  onApprove={onApprovePlace}
                />
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

type AdminAuthPanelProps = {
  session: Session | null;
  authError: string | null;
  authLoading: boolean;
  onSignIn: (email: string, password: string) => void;
  onSignOut: () => void;
};

function AdminAuthPanel({
  session,
  authError,
  authLoading,
  onSignIn,
  onSignOut,
}: AdminAuthPanelProps) {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await onSignIn(value.email, value.password);
    },
  });

  return (
    <main className="px-6 pb-16">
      <section className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>
              Sign in with Supabase Auth to review crawled listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Signed in as {session.user.email}
                </p>
                <Button variant="outline" onClick={onSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <form.Field
                    name="email"
                    children={(field) => (
                      <Input
                        type="email"
                        value={field.state.value ?? ""}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="admin@example.com"
                      />
                    )}
                  />
                  <form.Field
                    name="password"
                    children={(field) => (
                      <Input
                        type="password"
                        value={field.state.value ?? ""}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Password"
                      />
                    )}
                  />
                </div>
                {authError && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
                <Button type="submit" disabled={authLoading}>
                  {authLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function ExploreEventsRoute() {
  const { events, places } = useAppData();
  return <ExplorePage events={events} places={places} />;
}

function ExplorePlacesRoute() {
  const { events, places } = useAppData();
  return <ExplorePage events={events} places={places} />;
}

function AdminRoute() {
  const {
    pendingEvents,
    pendingPlaces,
    pendingCrawlJobs,
    crawlUrl,
    crawlType,
    statusMessage,
    refreshMessage,
    isSubmitting,
    isRefreshing,
    session,
    authError,
    authLoading,
    setCrawlUrl,
    setCrawlType,
    handleCrawlSubmit,
    handleRefreshJobs,
    saveEvent,
    savePlace,
    approveEvent,
    approvePlace,
    handleSignIn,
    handleSignOut,
  } = useAppData();

  return session ? (
    <AdminPage
      pendingEvents={pendingEvents}
      pendingPlaces={pendingPlaces}
      pendingCrawlJobs={pendingCrawlJobs}
      crawlUrl={crawlUrl}
      crawlType={crawlType}
      statusMessage={statusMessage}
      refreshMessage={refreshMessage}
      isSubmitting={isSubmitting}
      isRefreshing={isRefreshing}
      onCrawlUrlChange={setCrawlUrl}
      onCrawlTypeChange={setCrawlType}
      onCrawlSubmit={handleCrawlSubmit}
      onRefreshJobs={handleRefreshJobs}
      onSaveEvent={saveEvent}
      onSavePlace={savePlace}
      onApproveEvent={approveEvent}
      onApprovePlace={approvePlace}
    />
  ) : (
    <AdminAuthPanel
      session={session}
      authError={authError}
      authLoading={authLoading}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    />
  );
}

function RootLayout() {
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlType, setCrawlType] = useState<"events" | "places">("events");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const heroCopy = useMemo(
    () => "Review crawled listings, edit details, and approve when ready.",
    []
  );

  const location = useRouterState({ select: (state) => state.location });
  const isAdminRoute = location.pathname.startsWith("/admin");
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events", "public", location.pathname],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const placesQuery = useQuery({
    queryKey: ["places", "public", location.pathname],
    queryFn: async () => {
      const { data } = await supabase
        .from("places")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const pendingEventsQuery = useQuery({
    queryKey: ["events", "pending", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const pendingPlacesQuery = useQuery({
    queryKey: ["places", "pending", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("places")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const pendingCrawlJobsQuery = useQuery({
    queryKey: ["crawl_jobs", "pending", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    refetchInterval: isAdminRoute && Boolean(session) ? 5000 : false,
    queryFn: async () => {
      const { data } = await supabase
        .from("crawl_jobs")
        .select("id, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return (data ?? []) as CrawlJob[];
    },
  });

  const events = eventsQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const pendingEvents = pendingEventsQuery.data ?? [];
  const pendingPlaces = pendingPlacesQuery.data ?? [];
  const pendingCrawlJobs = pendingCrawlJobsQuery.data ?? [];

  useEffect(() => {
    const setInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    setInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleCrawlSubmit = async () => {
    if (!crawlUrl) {
      setStatusMessage("Please enter a URL to crawl.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setRefreshMessage(null);
    const { error } = await supabase.functions.invoke("api", {
      method: "POST",
      path: "/crawl",
      body: { url: crawlUrl, type: crawlType },
    });

    if (error) {
      setStatusMessage(error.message ?? "Crawl failed. Check the API logs.");
    } else {
      setStatusMessage(
        "Crawl queued. Use refresh to check for completed jobs.",
      );
      setCrawlUrl("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["places", "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["crawl_jobs", "pending"] }),
      ]);
    }
    setIsSubmitting(false);
  };

  const handleRefreshJobs = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    const { data, error } = await supabase.functions.invoke("api", {
      method: "POST",
      path: "/refresh",
    });

    if (error) {
      setRefreshMessage(error.message ?? "Failed to refresh crawl jobs.");
    } else {
      const summary = data as {
        completed?: number;
        failed?: number;
        pending?: number;
        insertedEvents?: number;
        insertedPlaces?: number;
      };
      const completedCount = summary.completed ?? 0;
      const failedCount = summary.failed ?? 0;
      const insertedCount =
        (summary.insertedEvents ?? 0) + (summary.insertedPlaces ?? 0);
      setRefreshMessage(
        `${completedCount} job${completedCount === 1 ? "" : "s"} completed, ${failedCount} failed, ${insertedCount} new item${insertedCount === 1 ? "" : "s"} added.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["places", "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["crawl_jobs", "pending"] }),
      ]);
    }
    setIsRefreshing(false);
  };

  const saveEvent = async (id: string, draft: EventDraft) => {
    await supabase
      .from("events")
      .update({
        title: draft.title,
        description: draft.description,
        start_time: draft.start_time,
        end_time: draft.end_time,
        location_name: draft.location_name,
        address: draft.address,
        website: draft.website,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      .eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["events", "pending"] });
  };

  const savePlace = async (id: string, draft: PlaceDraft) => {
    await supabase
      .from("places")
      .update({
        name: draft.name,
        description: draft.description,
        category: draft.category,
        address: draft.address,
        website: draft.website,
        family_friendly: draft.family_friendly,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      .eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["places", "pending"] });
  };

  const approveEvent = async (id: string) => {
    await supabase.from("events").update({ approved: true }).eq("id", id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
      queryClient.invalidateQueries({ queryKey: ["events", "public"] }),
    ]);
  };

  const approvePlace = async (id: string) => {
    await supabase.from("places").update({ approved: true }).eq("id", id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["places", "pending"] }),
      queryClient.invalidateQueries({ queryKey: ["places", "public"] }),
    ]);
  };

  const handleSignIn = async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const appData: AppData = {
    events,
    places,
    pendingEvents,
    pendingPlaces,
    pendingCrawlJobs,
    crawlUrl,
    crawlType,
    statusMessage,
    refreshMessage,
    isSubmitting,
    isRefreshing,
    session,
    authError,
    authLoading,
    setCrawlUrl,
    setCrawlType,
    handleCrawlSubmit,
    handleRefreshJobs,
    saveEvent,
    savePlace,
    approveEvent,
    approvePlace,
    handleSignIn,
    handleSignOut,
  };

  return (
    <AppDataContext.Provider value={appData}>
      <div className="min-h-screen bg-background">
        <header className="px-6 py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Golden</p>
              <h1 className="text-xl font-semibold text-foreground">
                Family Events & Places
              </h1>
            </div>
            <nav className="flex flex-wrap gap-4">
              <Link to="/" className={navLinkStyles}>
                Home
              </Link>
              <Link to="/explore/events" className={navLinkStyles}>
                Events
              </Link>
              <Link to="/explore/places" className={navLinkStyles}>
                Places
              </Link>
              <Link to="/admin" className={navLinkStyles}>
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {isAdminRoute && (
          <section className="px-6 pb-8">
            <div className="mx-auto max-w-6xl rounded-2xl border border-muted bg-white px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Admin workspace
                  </p>
                  <p className="text-lg font-medium text-foreground">{heroCopy}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {session
                      ? `Signed in as ${session.user.email}`
                      : "Sign in to manage crawled listings."}
                  </p>
                </div>
                {session && (
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        <Outlet />
      </div>
    </AppDataContext.Provider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MarketingPage,
});

const exploreEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/events",
  component: ExploreEventsRoute,
});

const explorePlacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/places",
  component: ExplorePlacesRoute,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminRoute,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreEventsRoute,
  explorePlacesRoute,
  adminRoute,
]);
