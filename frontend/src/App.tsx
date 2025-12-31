import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MapPinned,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
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
  eventDrafts: Record<string, EventDraft>;
  placeDrafts: Record<string, PlaceDraft>;
  crawlUrl: string;
  crawlType: "events" | "places";
  statusMessage: string | null;
  isSubmitting: boolean;
  onCrawlUrlChange: (value: string) => void;
  onCrawlTypeChange: (value: "events" | "places") => void;
  onCrawlSubmit: () => void;
  onEventDraftChange: (id: string, key: keyof EventDraft, value: string) => void;
  onPlaceDraftChange: (
    id: string,
    key: keyof PlaceDraft,
    value: string | boolean
  ) => void;
  onSaveEvent: (id: string) => void;
  onSavePlace: (id: string) => void;
  onApproveEvent: (id: string) => void;
  onApprovePlace: (id: string) => void;
};

function AdminPage({
  pendingEvents,
  pendingPlaces,
  eventDrafts,
  placeDrafts,
  crawlUrl,
  crawlType,
  statusMessage,
  isSubmitting,
  onCrawlUrlChange,
  onCrawlTypeChange,
  onCrawlSubmit,
  onEventDraftChange,
  onPlaceDraftChange,
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
            <CardTitle>Review pending events</CardTitle>
            <CardDescription>Edit the details before approving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pendingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending events.</p>
            ) : (
              pendingEvents.map((event) => {
                const draft = eventDrafts[event.id];
                if (!draft) return null;
                return (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-muted p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <Input
                          value={draft.title}
                          onChange={(e) =>
                            onEventDraftChange(event.id, "title", e.target.value)
                          }
                          placeholder="Event title"
                        />
                        <Textarea
                          value={draft.description}
                          onChange={(e) =>
                            onEventDraftChange(
                              event.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={draft.start_time}
                            onChange={(e) =>
                              onEventDraftChange(
                                event.id,
                                "start_time",
                                e.target.value
                              )
                            }
                            placeholder="Start time"
                          />
                          <Input
                            value={draft.end_time}
                            onChange={(e) =>
                              onEventDraftChange(
                                event.id,
                                "end_time",
                                e.target.value
                              )
                            }
                            placeholder="End time"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={draft.location_name}
                          onChange={(e) =>
                            onEventDraftChange(
                              event.id,
                              "location_name",
                              e.target.value
                            )
                          }
                          placeholder="Location"
                        />
                        <Input
                          value={draft.address}
                          onChange={(e) =>
                            onEventDraftChange(
                              event.id,
                              "address",
                              e.target.value
                            )
                          }
                          placeholder="Address"
                        />
                        <Input
                          value={draft.website}
                          onChange={(e) =>
                            onEventDraftChange(
                              event.id,
                              "website",
                              e.target.value
                            )
                          }
                          placeholder="Website"
                        />
                        <Input
                          value={draft.tags}
                          onChange={(e) =>
                            onEventDraftChange(event.id, "tags", e.target.value)
                          }
                          placeholder="Tags (comma separated)"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => onSaveEvent(event.id)}>
                        Save edits
                      </Button>
                      <Button onClick={() => onApproveEvent(event.id)}>
                        Approve event
                      </Button>
                    </div>
                  </div>
                );
              })
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
              pendingPlaces.map((place) => {
                const draft = placeDrafts[place.id];
                if (!draft) return null;
                return (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-muted p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <Input
                          value={draft.name}
                          onChange={(e) =>
                            onPlaceDraftChange(place.id, "name", e.target.value)
                          }
                          placeholder="Place name"
                        />
                        <Textarea
                          value={draft.description}
                          onChange={(e) =>
                            onPlaceDraftChange(
                              place.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                        />
                        <Input
                          value={draft.category}
                          onChange={(e) =>
                            onPlaceDraftChange(place.id, "category", e.target.value)
                          }
                          placeholder="Category"
                        />
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={draft.address}
                          onChange={(e) =>
                            onPlaceDraftChange(place.id, "address", e.target.value)
                          }
                          placeholder="Address"
                        />
                        <Input
                          value={draft.website}
                          onChange={(e) =>
                            onPlaceDraftChange(place.id, "website", e.target.value)
                          }
                          placeholder="Website"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={draft.family_friendly}
                            onChange={(e) =>
                              onPlaceDraftChange(
                                place.id,
                                "family_friendly",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-muted"
                          />
                          Family-friendly
                        </div>
                        <Input
                          value={draft.tags}
                          onChange={(e) =>
                            onPlaceDraftChange(place.id, "tags", e.target.value)
                          }
                          placeholder="Tags (comma separated)"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => onSavePlace(place.id)}>
                        Save edits
                      </Button>
                      <Button onClick={() => onApprovePlace(place.id)}>
                        Approve place
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

type AdminAuthPanelProps = {
  session: Session | null;
  authEmail: string;
  authPassword: string;
  authError: string | null;
  authLoading: boolean;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

function AdminAuthPanel({
  session,
  authEmail,
  authPassword,
  authError,
  authLoading,
  onAuthEmailChange,
  onAuthPasswordChange,
  onSignIn,
  onSignOut,
}: AdminAuthPanelProps) {
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
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="email"
                    value={authEmail}
                    onChange={(event) => onAuthEmailChange(event.target.value)}
                    placeholder="admin@example.com"
                  />
                  <Input
                    type="password"
                    value={authPassword}
                    onChange={(event) => onAuthPasswordChange(event.target.value)}
                    placeholder="Password"
                  />
                </div>
                {authError && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
                <Button onClick={onSignIn} disabled={authLoading}>
                  {authLoading ? "Signing in..." : "Sign in"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [pendingPlaces, setPendingPlaces] = useState<Place[]>([]);
  const [eventDrafts, setEventDrafts] = useState<Record<string, EventDraft>>({});
  const [placeDrafts, setPlaceDrafts] = useState<Record<string, PlaceDraft>>({});
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlType, setCrawlType] = useState<"events" | "places">("events");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const heroCopy = useMemo(
    () => "Review crawled listings, edit details, and approve when ready.",
    []
  );

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const fetchPublic = async () => {
      const [{ data: eventsData }, { data: placesData }] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("places")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false }),
      ]);
      setEvents(eventsData ?? []);
      setPlaces(placesData ?? []);
    };

    fetchPublic();
  }, []);

  const fetchAdmin = async () => {
    if (!session) return;
    const [{ data: eventsData }, { data: placesData }] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("places")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false }),
    ]);
    setPendingEvents(eventsData ?? []);
    setPendingPlaces(placesData ?? []);
  };

  useEffect(() => {
    if (isAdminRoute && session) {
      fetchAdmin();
    } else if (isAdminRoute && !session) {
      setPendingEvents([]);
      setPendingPlaces([]);
    }
  }, [isAdminRoute, session]);

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

  useEffect(() => {
    const drafts: Record<string, EventDraft> = {};
    pendingEvents.forEach((event) => {
      drafts[event.id] = {
        title: event.title ?? "",
        description: event.description ?? "",
        start_time: event.start_time ?? "",
        end_time: event.end_time ?? "",
        location_name: event.location_name ?? "",
        address: event.address ?? "",
        website: event.website ?? "",
        tags: event.tags?.join(", ") ?? "",
      };
    });
    setEventDrafts(drafts);
  }, [pendingEvents]);

  useEffect(() => {
    const drafts: Record<string, PlaceDraft> = {};
    pendingPlaces.forEach((place) => {
      drafts[place.id] = {
        name: place.name ?? "",
        description: place.description ?? "",
        category: place.category ?? "",
        address: place.address ?? "",
        website: place.website ?? "",
        family_friendly: place.family_friendly ?? false,
        tags: place.tags?.join(", ") ?? "",
      };
    });
    setPlaceDrafts(drafts);
  }, [pendingPlaces]);

  const refreshPublic = async () => {
    const [{ data: eventsData }, { data: placesData }] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("places")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false }),
    ]);
    setEvents(eventsData ?? []);
    setPlaces(placesData ?? []);
  };

  const handleCrawlSubmit = async () => {
    if (!crawlUrl) {
      setStatusMessage("Please enter a URL to crawl.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    const { error } = await supabase.functions.invoke("api", {
      method: "POST",
      path: "/crawl",
      body: { url: crawlUrl, type: crawlType },
    });

    if (error) {
      setStatusMessage(error.message ?? "Crawl failed. Check the API logs.");
    } else {
      setStatusMessage("Crawl started. New items were added to review.");
      setCrawlUrl("");
      await fetchAdmin();
    }
    setIsSubmitting(false);
  };

  const handleEventDraftChange = (
    id: string,
    key: keyof EventDraft,
    value: string
  ) => {
    setEventDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const handlePlaceDraftChange = (
    id: string,
    key: keyof PlaceDraft,
    value: string | boolean
  ) => {
    setPlaceDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const saveEvent = async (id: string) => {
    const draft = eventDrafts[id];
    if (!draft) return;
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
    await fetchAdmin();
  };

  const savePlace = async (id: string) => {
    const draft = placeDrafts[id];
    if (!draft) return;
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
    await fetchAdmin();
  };

  const approveEvent = async (id: string) => {
    await supabase.from("events").update({ approved: true }).eq("id", id);
    await Promise.all([fetchAdmin(), refreshPublic()]);
  };

  const approvePlace = async (id: string) => {
    await supabase.from("places").update({ approved: true }).eq("id", id);
    await Promise.all([fetchAdmin(), refreshPublic()]);
  };

  const handleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
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
            <NavLink to="/" className={navLinkStyles}>
              Home
            </NavLink>
            <NavLink to="/explore/events" className={navLinkStyles}>
              Events
            </NavLink>
            <NavLink to="/explore/places" className={navLinkStyles}>
              Places
            </NavLink>
            <NavLink to="/admin" className={navLinkStyles}>
              Admin
            </NavLink>
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

      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route
          path="/explore/events"
          element={<ExplorePage events={events} places={places} />}
        />
        <Route
          path="/explore/places"
          element={<ExplorePage events={events} places={places} />}
        />
        <Route
          path="/admin"
          element={
            session ? (
              <AdminPage
                pendingEvents={pendingEvents}
                pendingPlaces={pendingPlaces}
                eventDrafts={eventDrafts}
                placeDrafts={placeDrafts}
                crawlUrl={crawlUrl}
                crawlType={crawlType}
                statusMessage={statusMessage}
                isSubmitting={isSubmitting}
                onCrawlUrlChange={setCrawlUrl}
                onCrawlTypeChange={setCrawlType}
                onCrawlSubmit={handleCrawlSubmit}
                onEventDraftChange={handleEventDraftChange}
                onPlaceDraftChange={handlePlaceDraftChange}
                onSaveEvent={saveEvent}
                onSavePlace={savePlace}
                onApproveEvent={approveEvent}
                onApprovePlace={approvePlace}
              />
            ) : (
              <AdminAuthPanel
                session={session}
                authEmail={authEmail}
                authPassword={authPassword}
                authError={authError}
                authLoading={authLoading}
                onAuthEmailChange={setAuthEmail}
                onAuthPasswordChange={setAuthPassword}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
              />
            )
          }
        />
      </Routes>
    </div>
  );
}
