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
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  MapPinned,
  RefreshCw,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { ApprovedEventsTab } from "@/components/admin/ApprovedEventsTab";
import { CrawlJobsTab } from "@/components/admin/CrawlJobsTab";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import { PendingItemsTab } from "@/components/admin/PendingItemsTab";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { formatEventDatetime } from "@/lib/utils";
import type {
  AppData,
  CrawlJob,
  Event,
  EventDraft,
  Place,
  PlaceDraft,
} from "@/types";

const AppDataContext = createContext<AppData | null>(null);

const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataContext");
  }
  return context;
};

const navLinkInactive = "text-sm font-medium transition-colors text-muted-foreground hover:text-foreground";

type MarketingPageProps = {
  events: Event[];
  places: Place[];
};

function MarketingPage({ events, places }: MarketingPageProps) {
  const featuredEvents = events.slice(0, 4);
  const featuredPlaces = places.slice(0, 4);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <main className="px-6 pb-16">
      <section className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find family-friendly adventures
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Curated events and places for kids and caregivers. Every listing is reviewed and ready to go.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/events">
                <CalendarDays className="mr-2 h-5 w-5" />
                Browse Events
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/places">
                <MapPinned className="mr-2 h-5 w-5" />
                Explore Places
              </Link>
            </Button>
          </div>
        </div>

        {featuredEvents.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Upcoming Events</h2>
              <Button asChild variant="ghost" className="gap-1">
                <Link to="/events">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents.map((event) => (
                <ListingCard
                  key={event.id}
                  id={event.id}
                  title={event.title || "Untitled event"}
                  subtitle={formatEventDatetime(event.start_time, event.end_time)}
                  description={event.location_name || undefined}
                  category="events"
                  imageUrl={event.image_url}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </section>
        )}

        {featuredPlaces.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Popular Places</h2>
              <Button asChild variant="ghost" className="gap-1">
                <Link to="/places">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPlaces.map((place) => (
                <ListingCard
                  key={place.id}
                  id={place.id}
                  title={place.name || "Untitled place"}
                  subtitle={place.category || "Family-friendly spot"}
                  description={place.address || undefined}
                  category="places"
                />
              ))}
            </div>
          </section>
        )}

        {featuredEvents.length === 0 && featuredPlaces.length === 0 && (
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle>No listings yet</CardTitle>
              <CardDescription>
                Check back soon for family-friendly events and places.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin">Go to Admin</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </main>
  );
}

type EventsPageProps = {
  events: Event[];
};

function EventsPage({ events }: EventsPageProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <main className="px-6 pb-16">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="mt-2 text-muted-foreground">
            Family-friendly events happening soon
          </p>
        </div>

        {events.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No events yet</CardTitle>
              <CardDescription>
                Check back soon for upcoming family events.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <ListingCard
                key={event.id}
                id={event.id}
                title={event.title || "Untitled event"}
                subtitle={formatEventDatetime(event.start_time, event.end_time)}
                description={event.location_name || undefined}
                category="events"
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </section>

      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </main>
  );
}

type PlacesPageProps = {
  places: Place[];
};

function PlacesPage({ places }: PlacesPageProps) {
  return (
    <main className="px-6 pb-16">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Places</h1>
          <p className="mt-2 text-muted-foreground">
            Family-friendly destinations to explore
          </p>
        </div>

        {places.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No places yet</CardTitle>
              <CardDescription>
                Check back soon for family-friendly places.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {places.map((place) => (
              <ListingCard
                key={place.id}
                id={place.id}
                title={place.name || "Untitled place"}
                subtitle={place.category || "Family-friendly spot"}
                description={place.address || undefined}
                category="places"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

type AdminPageProps = {
  approvedEvents: Event[];
  allCrawlJobs: CrawlJob[];
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
  onDeleteEvent: (id: string) => void;
  onDeletePlace: (id: string) => void;
};

function AdminPage({
  approvedEvents,
  allCrawlJobs,
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
  onDeleteEvent,
  onDeletePlace,
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

        {pendingCrawlJobs.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-muted bg-muted/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {pendingCrawlJobs.length} crawl
              {pendingCrawlJobs.length === 1 ? "" : "s"} in progress...
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshJobs}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Jobs"}
            </Button>
          </div>
        )}

        {refreshMessage && (
          <p className="text-sm text-muted-foreground">{refreshMessage}</p>
        )}

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Pending Review ({pendingEvents.length + pendingPlaces.length})
            </TabsTrigger>
            <TabsTrigger value="approved-events" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Approved Events ({approvedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Crawl Jobs ({allCrawlJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Review Pending Items</CardTitle>
                <CardDescription>
                  Edit and approve events or places before publishing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingItemsTab
                  pendingEvents={pendingEvents}
                  pendingPlaces={pendingPlaces}
                  onSaveEvent={onSaveEvent}
                  onSavePlace={onSavePlace}
                  onApproveEvent={onApproveEvent}
                  onApprovePlace={onApprovePlace}
                  onDeleteEvent={onDeleteEvent}
                  onDeletePlace={onDeletePlace}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved-events">
            <Card>
              <CardHeader>
                <CardTitle>Edit Approved Events</CardTitle>
                <CardDescription>
                  Quickly update published event details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovedEventsTab
                  events={approvedEvents}
                  onSaveEvent={onSaveEvent}
                  onDeleteEvent={onDeleteEvent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Crawl Jobs</CardTitle>
                    <CardDescription>
                      View all crawl jobs and their status.
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
              <CardContent>
                <CrawlJobsTab jobs={allCrawlJobs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

function MarketingRoute() {
  const { events, places } = useAppData();
  return <MarketingPage events={events} places={places} />;
}

function EventsRoute() {
  const { events } = useAppData();
  return <EventsPage events={events} />;
}

function PlacesRoute() {
  const { places } = useAppData();
  return <PlacesPage places={places} />;
}

function ExploreEventsRedirect() {
  return <Navigate to="/events" replace />;
}

function ExplorePlacesRedirect() {
  return <Navigate to="/places" replace />;
}

function AdminRoute() {
  const {
    events,
    allCrawlJobs,
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
    deleteEvent,
    deletePlace,
    handleSignIn,
    handleSignOut,
  } = useAppData();

  return session ? (
    <AdminPage
      approvedEvents={events}
      allCrawlJobs={allCrawlJobs}
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
      onDeleteEvent={deleteEvent}
      onDeletePlace={deletePlace}
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
      return (data ?? []) as Event[];
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
      return (data ?? []) as Place[];
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
      return (data ?? []) as Event[];
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
      return (data ?? []) as Place[];
    },
  });

  const allCrawlJobsQuery = useQuery({
    queryKey: ["crawl_jobs", "all", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("crawl_jobs")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as CrawlJob[];
    },
  });

  const pendingCrawlJobsQuery = useQuery({
    queryKey: ["crawl_jobs", "pending", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    refetchInterval: isAdminRoute && Boolean(session) ? 5000 : false,
    queryFn: async () => {
      const { data } = await supabase
        .from("crawl_jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return (data ?? []) as CrawlJob[];
    },
  });

  const events = eventsQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const pendingEvents = pendingEventsQuery.data ?? [];
  const pendingPlaces = pendingPlacesQuery.data ?? [];
  const allCrawlJobs = allCrawlJobsQuery.data ?? [];
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
    const { error } = await supabase.functions.invoke("api/crawl", {
      method: "POST",
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
        queryClient.invalidateQueries({ queryKey: ["crawl_jobs"] }),
      ]);
    }
    setIsSubmitting(false);
  };

  const handleRefreshJobs = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    const { data, error } = await supabase.functions.invoke("api/refresh", {
      method: "POST",
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
        queryClient.invalidateQueries({ queryKey: ["crawl_jobs"] }),
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
        price: draft.price,
        age_range: draft.age_range,
        image_url: draft.image_url,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      .eq("id", id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
      queryClient.invalidateQueries({ queryKey: ["events", "public"] }),
    ]);
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

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
      queryClient.invalidateQueries({ queryKey: ["events", "public"] }),
    ]);
  };

  const deletePlace = async (id: string) => {
    await supabase.from("places").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["places", "pending"] });
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
    allCrawlJobs,
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
    deleteEvent,
    deletePlace,
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
              <Link to="/" className={navLinkInactive}>
                Home
              </Link>
              <Link to="/events" className={navLinkInactive}>
                Events
              </Link>
              <Link to="/places" className={navLinkInactive}>
                Places
              </Link>
              <Link to="/admin" className={navLinkInactive}>
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
  component: MarketingRoute,
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events",
  component: EventsRoute,
});

const placesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/places",
  component: PlacesRoute,
});

const exploreEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/events",
  component: ExploreEventsRedirect,
});

const explorePlacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/places",
  component: ExplorePlacesRedirect,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminRoute,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  eventsRoute,
  placesRoute,
  exploreEventsRoute,
  explorePlacesRoute,
  adminRoute,
]);
