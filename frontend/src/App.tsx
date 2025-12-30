import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MapPinned,
  Search,
  ShieldCheck,
} from "lucide-react";

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

const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

type Event = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location_name: string;
  address: string;
  website: string;
  tags: string[];
  approved: boolean;
};

type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  website: string;
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

export default function App() {
  const [view, setView] = useState<"explore" | "admin">("explore");
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

  const isAdmin = view === "admin";

  const heroCopy = useMemo(
    () =>
      view === "explore"
        ? "Discover what to do this weekend — curated for kids and caregivers."
        : "Review crawled listings, edit details, and approve when ready.",
    [view]
  );

  useEffect(() => {
    const fetchPublic = async () => {
      const [eventsResponse, placesResponse] = await Promise.all([
        fetch(`${apiBase}/api/events`),
        fetch(`${apiBase}/api/places`),
      ]);
      if (eventsResponse.ok) {
        setEvents(await eventsResponse.json());
      }
      if (placesResponse.ok) {
        setPlaces(await placesResponse.json());
      }
    };

    fetchPublic();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const fetchAdmin = async () => {
      const [eventsResponse, placesResponse] = await Promise.all([
        fetch(`${apiBase}/api/admin/events`),
        fetch(`${apiBase}/api/admin/places`),
      ]);
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setPendingEvents(data);
      }
      if (placesResponse.ok) {
        const data = await placesResponse.json();
        setPendingPlaces(data);
      }
    };

    fetchAdmin();
  }, [isAdmin]);

  useEffect(() => {
    const drafts: Record<string, EventDraft> = {};
    pendingEvents.forEach((event) => {
      drafts[event.id] = {
        title: event.title,
        description: event.description,
        start_time: event.start_time ?? "",
        end_time: event.end_time ?? "",
        location_name: event.location_name,
        address: event.address,
        website: event.website,
        tags: event.tags?.join(", ") ?? "",
      };
    });
    setEventDrafts(drafts);
  }, [pendingEvents]);

  useEffect(() => {
    const drafts: Record<string, PlaceDraft> = {};
    pendingPlaces.forEach((place) => {
      drafts[place.id] = {
        name: place.name,
        description: place.description,
        category: place.category,
        address: place.address,
        website: place.website,
        family_friendly: place.family_friendly,
        tags: place.tags?.join(", ") ?? "",
      };
    });
    setPlaceDrafts(drafts);
  }, [pendingPlaces]);

  const refreshAdmin = async () => {
    if (!isAdmin) {
      return;
    }
    const [eventsResponse, placesResponse] = await Promise.all([
      fetch(`${apiBase}/api/admin/events`),
      fetch(`${apiBase}/api/admin/places`),
    ]);
    if (eventsResponse.ok) {
      setPendingEvents(await eventsResponse.json());
    }
    if (placesResponse.ok) {
      setPendingPlaces(await placesResponse.json());
    }
  };

  const refreshPublic = async () => {
    const [eventsResponse, placesResponse] = await Promise.all([
      fetch(`${apiBase}/api/events`),
      fetch(`${apiBase}/api/places`),
    ]);
    if (eventsResponse.ok) {
      setEvents(await eventsResponse.json());
    }
    if (placesResponse.ok) {
      setPlaces(await placesResponse.json());
    }
  };

  const handleCrawlSubmit = async () => {
    if (!crawlUrl) {
      setStatusMessage("Please enter a URL to crawl.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    const response = await fetch(`${apiBase}/api/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: crawlUrl, type: crawlType }),
    });

    if (response.ok) {
      setStatusMessage("Crawl started. New items were added to review.");
      setCrawlUrl("");
      await refreshAdmin();
    } else {
      const payload = await response.json();
      setStatusMessage(payload.error ?? "Crawl failed. Check the API logs.");
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
    await fetch(`${apiBase}/api/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
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
      }),
    });
    await refreshAdmin();
  };

  const savePlace = async (id: string) => {
    const draft = placeDrafts[id];
    if (!draft) return;
    await fetch(`${apiBase}/api/places`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
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
      }),
    });
    await refreshAdmin();
  };

  const approveEvent = async (id: string) => {
    await fetch(`${apiBase}/api/events/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await Promise.all([refreshAdmin(), refreshPublic()]);
  };

  const approvePlace = async (id: string) => {
    await fetch(`${apiBase}/api/places/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await Promise.all([refreshAdmin(), refreshPublic()]);
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
          <div className="flex flex-wrap gap-3">
            <Button
              variant={view === "explore" ? "default" : "outline"}
              onClick={() => setView("explore")}
            >
              Explore
            </Button>
            <Button
              variant={view === "admin" ? "default" : "outline"}
              onClick={() => setView("admin")}
            >
              Admin Review
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 pb-16">
        <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Trusted family-ready listings
            </span>
            <h2 className="text-4xl font-semibold leading-tight text-foreground">
              {heroCopy}
            </h2>
            <p className="text-base text-muted-foreground">
              Golden crawls community calendars and attraction sites, then our admin
              team approves each listing before it appears in the mobile-friendly
              directory.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button>
                <Search className="mr-2 h-4 w-4" /> Explore events
              </Button>
              <Button variant="outline">Browse activity places</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <Card key={item.title} className="border-muted">
                  <CardHeader>
                    <item.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="mt-3 text-base">
                      {item.title}
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
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
                    <div
                      key={event.id}
                      className="rounded-xl bg-muted px-4 py-3"
                    >
                      <p className="font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.start_time || "Time TBD"} · {event.location_name}
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
                        {place.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {place.category || "Family-friendly spot"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {isAdmin && (
          <section className="mx-auto mt-12 max-w-6xl space-y-8">
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
                      onChange={(event) => setCrawlUrl(event.target.value)}
                      placeholder="https://example.com/calendar"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Type
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={crawlType === "events" ? "default" : "outline"}
                        onClick={() => setCrawlType("events")}
                      >
                        Events
                      </Button>
                      <Button
                        variant={crawlType === "places" ? "default" : "outline"}
                        onClick={() => setCrawlType("places")}
                      >
                        Places
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleCrawlSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Start crawl"}
                  </Button>
                </div>
                {statusMessage && (
                  <p className="text-sm text-muted-foreground">
                    {statusMessage}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review pending events</CardTitle>
                <CardDescription>
                  Edit the details before approving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pendingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pending events.
                  </p>
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
                                handleEventDraftChange(
                                  event.id,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Event title"
                            />
                            <Textarea
                              value={draft.description}
                              onChange={(e) =>
                                handleEventDraftChange(
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
                                  handleEventDraftChange(
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
                                  handleEventDraftChange(
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
                                handleEventDraftChange(
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
                                handleEventDraftChange(
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
                                handleEventDraftChange(
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
                                handleEventDraftChange(
                                  event.id,
                                  "tags",
                                  e.target.value
                                )
                              }
                              placeholder="Tags (comma separated)"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="outline" onClick={() => saveEvent(event.id)}>
                            Save edits
                          </Button>
                          <Button onClick={() => approveEvent(event.id)}>
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
                <CardDescription>
                  Confirm the experience before publishing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pendingPlaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pending places.
                  </p>
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
                                handlePlaceDraftChange(
                                  place.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Place name"
                            />
                            <Textarea
                              value={draft.description}
                              onChange={(e) =>
                                handlePlaceDraftChange(
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
                                handlePlaceDraftChange(
                                  place.id,
                                  "category",
                                  e.target.value
                                )
                              }
                              placeholder="Category"
                            />
                          </div>
                          <div className="space-y-3">
                            <Input
                              value={draft.address}
                              onChange={(e) =>
                                handlePlaceDraftChange(
                                  place.id,
                                  "address",
                                  e.target.value
                                )
                              }
                              placeholder="Address"
                            />
                            <Input
                              value={draft.website}
                              onChange={(e) =>
                                handlePlaceDraftChange(
                                  place.id,
                                  "website",
                                  e.target.value
                                )
                              }
                              placeholder="Website"
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={draft.family_friendly}
                                onChange={(e) =>
                                  handlePlaceDraftChange(
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
                                handlePlaceDraftChange(
                                  place.id,
                                  "tags",
                                  e.target.value
                                )
                              }
                              placeholder="Tags (comma separated)"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="outline" onClick={() => savePlace(place.id)}>
                            Save edits
                          </Button>
                          <Button onClick={() => approvePlace(place.id)}>
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
        )}

        <section className="mx-auto mt-12 max-w-6xl">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="grid gap-6 py-8 md:grid-cols-[1.5fr_1fr]">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Admin workflow powered by Firecrawl + Supabase
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  Submit a website, review structured events or places, and publish
                  approved listings instantly.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <Button variant="outline" className="bg-white/10 text-white">
                  View admin dashboard
                </Button>
                <p className="text-xs text-primary-foreground/70">
                  Connect your Supabase instance and Firecrawl API key to start
                  crawling.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
