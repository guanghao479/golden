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
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  LogOut,
  MapPinned,
  Search,
  Tag,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { ApprovedItemsTab } from "@/components/admin/ApprovedItemsTab";
import { CrawlSourcesTab } from "@/components/admin/CrawlSourcesTab";
import { EventDetailDialog } from "@/components/EventDetailDialog";
import {
  getDateRangeForPreset,
  type DatePreset,
  type FilterParams,
} from "@/components/ListingFilters";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PendingItemsTab } from "@/components/admin/PendingItemsTab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { formatEventDatetime } from "@/lib/utils";
import type {
  AppData,
  CrawlSource,
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

const navLinkBase = "text-sm font-medium transition-colors";
const navLinkInactive = `${navLinkBase} text-muted-foreground hover:text-foreground`;
const navLinkActive = `${navLinkBase} text-foreground`;

type UserAvatarProps = {
  email: string;
  onSignOut: () => void;
};

function UserAvatar({ email, onSignOut }: UserAvatarProps) {
  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-9 w-9 cursor-pointer border border-muted hover:border-foreground/20 transition-colors">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type HeaderFilterBarProps = {
  showDateFilter: boolean;
  availableTags: string[];
};

function HeaderFilterBar({ showDateFilter, availableTags }: HeaderFilterBarProps) {
  const location = useRouterState({ select: (state) => state.location });
  const navigate = useNavigate();
  const searchParams = location.search as Record<string, string | undefined>;
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.search ?? "");

  const datePreset = (searchParams.datePreset ?? "any") as DatePreset;
  const tagsValue = searchParams.tags ?? "";
  const selectedTags = tagsValue ? tagsValue.split(",") : [];
  const hasActiveTags = selectedTags.length > 0;

  const dateFrom = searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined;
  const dateTo = searchParams.dateTo ? new Date(searchParams.dateTo) : undefined;

  const getDateLabel = () => {
    switch (datePreset) {
      case "any": return "Any Date";
      case "today": return "Today";
      case "this-weekend": return "This Weekend";
      case "next-7-days": return "This Week";
      case "next-30-days": return "This Month";
      case "custom": return "Custom";
      default: return "This Month";
    }
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const range = getDateRangeForPreset(preset);
    navigate({
      to: location.pathname,
      search: {
        ...searchParams,
        dateFrom: range?.from.toISOString(),
        dateTo: range?.to.toISOString(),
        datePreset: preset,
      },
    });
    if (preset !== "custom") {
      setDatePopoverOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    navigate({
      to: location.pathname,
      search: {
        ...searchParams,
        search: searchInput || undefined,
      },
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    navigate({
      to: location.pathname,
      search: {
        ...searchParams,
        tags: newTags.length > 0 ? newTags.join(",") : undefined,
      },
    });
  };

  const sortedTags = [...availableTags].sort((a, b) => a.localeCompare(b));

  return (
    <div className="inline-flex items-center rounded-full border border-muted/50 bg-white shadow-sm">
      {showDateFilter && (
        <>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded-l-full transition-colors">
                <CalendarDays className="h-4 w-4" />
                <span>{getDateLabel()}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <div className="flex">
                <div className="flex flex-col gap-1 border-r p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Quick select
                  </p>
                  {(["any", "today", "this-weekend", "next-7-days", "next-30-days"] as DatePreset[]).map(
                    (preset) => (
                      <Button
                        key={preset}
                        variant={datePreset === preset ? "default" : "ghost"}
                        size="sm"
                        className="justify-start"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        {preset === "any" ? "Any Date" :
                         preset === "today" ? "Today" :
                         preset === "this-weekend" ? "This Weekend" :
                         preset === "next-7-days" ? "This Week" :
                         "This Month"}
                      </Button>
                    )
                  )}
                  <Button
                    variant={datePreset === "custom" ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetSelect("custom")}
                  >
                    Custom Range
                  </Button>
                </div>
                <div className="p-3">
                  <Calendar
                    mode="range"
                    selected={
                      dateFrom
                        ? {
                            from: dateFrom,
                            to: dateTo,
                          }
                        : undefined
                    }
                    onSelect={(range) => {
                      navigate({
                        to: location.pathname,
                        search: {
                          ...searchParams,
                          dateFrom: range?.from?.toISOString(),
                          dateTo: range?.to?.toISOString(),
                          datePreset: "custom",
                        },
                      });
                    }}
                    numberOfMonths={1}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="h-6 w-px bg-muted" />
        </>
      )}
      <div className={`flex items-center gap-2 px-4 py-2 ${!showDateFilter ? 'rounded-l-full' : ''}`}>
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onBlur={handleSearchSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearchSubmit();
            }
          }}
          className="w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="h-6 w-px bg-muted" />
      <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
        <PopoverTrigger asChild>
          <button className={`flex items-center gap-2 px-4 py-2 text-sm rounded-r-full transition-colors ${hasActiveTags ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Tag className="h-4 w-4" />
            <span>{hasActiveTags ? `${selectedTags.length} tags` : 'Tags'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Filter by tags
          </p>
          {sortedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {sortedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags available</p>
          )}
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() => {
                navigate({
                  to: location.pathname,
                  search: {
                    ...searchParams,
                    tags: undefined,
                  },
                });
              }}
            >
              Clear tags
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

type MarketingPageProps = {
  events: Event[];
  places: Place[];
};

function MarketingPage({ events, places }: MarketingPageProps) {
  const featuredEvents = events.slice(0, 4);
  const featuredPlaces = places.slice(0, 4);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <main>
      {/* Hero Section */}
      <div className="px-6 py-12">
        <section className="mx-auto max-w-6xl text-center">
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
        </section>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-8">
      <section className="mx-auto max-w-6xl">

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
                  imageUrl={place.image_url}
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
      </div>

      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </main>
  );
}

type EventsSearchParams = {
  dateFrom?: string;
  dateTo?: string;
  datePreset?: DatePreset;
  search?: string;
  tags?: string;
};

function EventsPage() {
  const searchParams = useSearch({ from: "/events" }) as EventsSearchParams;
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Convert URL params to FilterParams
  const filterParams: FilterParams = useMemo(() => {
    const preset = searchParams.datePreset ?? "any";
    // If no explicit dates but we have a preset, calculate the range
    if (!searchParams.dateFrom && !searchParams.dateTo && preset !== "custom") {
      const range = getDateRangeForPreset(preset);
      return {
        dateFrom: range?.from.toISOString(),
        dateTo: range?.to.toISOString(),
        datePreset: preset,
        search: searchParams.search,
        tags: searchParams.tags ? searchParams.tags.split(",") : undefined,
      };
    }
    return {
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      datePreset: preset,
      search: searchParams.search,
      tags: searchParams.tags ? searchParams.tags.split(",") : undefined,
    };
  }, [searchParams]);

  // Get effective date range for query
  const effectiveDateRange = useMemo(() => {
    if (filterParams.dateFrom && filterParams.dateTo) {
      return { from: filterParams.dateFrom, to: filterParams.dateTo };
    }
    const preset = filterParams.datePreset ?? "any";
    if (preset !== "custom") {
      const range = getDateRangeForPreset(preset);
      return range
        ? { from: range.from.toISOString(), to: range.to.toISOString() }
        : null;
    }
    return null;
  }, [filterParams]);

  // Server-side filtered query
  const eventsQuery = useQuery({
    queryKey: ["events", "filtered", filterParams],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("approved", true);

      // Date filter - events that overlap with the range
      if (effectiveDateRange) {
        // Event ends after range start AND event starts before range end
        query = query
          .gte("end_time", effectiveDateRange.from)
          .lte("start_time", effectiveDateRange.to);
      }

      // Search filter using ilike for case-insensitive search
      if (filterParams.search) {
        query = query.or(
          `title.ilike.%${filterParams.search}%,description.ilike.%${filterParams.search}%`
        );
      }

      // Tag filter - events containing all selected tags
      if (filterParams.tags && filterParams.tags.length > 0) {
        query = query.contains("tags", filterParams.tags);
      }

      query = query.order("start_time", { ascending: true });

      const { data } = await query;
      return (data ?? []) as Event[];
    },
  });

  const events = eventsQuery.data ?? [];

  return (
    <main className="px-6 py-6">
      <section className="mx-auto max-w-6xl">
        {eventsQuery.isLoading ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Loading events...</CardTitle>
            </CardHeader>
          </Card>
        ) : events.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No events found</CardTitle>
              <CardDescription>
                Try adjusting your filters to see more results.
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
                imageUrl={event.image_url}
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

type PlacesSearchParams = {
  search?: string;
  tags?: string;
};

function PlacesPage() {
  const searchParams = useSearch({ from: "/places" }) as PlacesSearchParams;

  // Convert URL params to FilterParams
  const filterParams: FilterParams = useMemo(() => {
    return {
      search: searchParams.search,
      tags: searchParams.tags ? searchParams.tags.split(",") : undefined,
    };
  }, [searchParams]);

  // Server-side filtered query
  const placesQuery = useQuery({
    queryKey: ["places", "filtered", filterParams],
    queryFn: async () => {
      let query = supabase
        .from("places")
        .select("*")
        .eq("approved", true);

      // Search filter using ilike for case-insensitive search
      if (filterParams.search) {
        query = query.or(
          `name.ilike.%${filterParams.search}%,description.ilike.%${filterParams.search}%`
        );
      }

      // Tag filter - places containing all selected tags
      if (filterParams.tags && filterParams.tags.length > 0) {
        query = query.contains("tags", filterParams.tags);
      }

      query = query.order("name", { ascending: true });

      const { data } = await query;
      return (data ?? []) as Place[];
    },
  });

  const places = placesQuery.data ?? [];

  return (
    <main className="px-6 py-6">
      <section className="mx-auto max-w-6xl">
        {placesQuery.isLoading ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Loading places...</CardTitle>
            </CardHeader>
          </Card>
        ) : places.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No places found</CardTitle>
              <CardDescription>
                Try adjusting your filters to see more results.
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
                imageUrl={place.image_url}
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
  approvedPlaces: Place[];
  crawlSources: CrawlSource[];
  pendingEvents: Event[];
  pendingPlaces: Place[];
  crawlUrl: string;
  crawlType: "events" | "places";
  statusMessage: string | null;
  isSubmitting: boolean;
  onCrawlUrlChange: (value: string) => void;
  onCrawlTypeChange: (value: "events" | "places") => void;
  onCrawlSubmit: () => void;
  onRecrawl: (source: CrawlSource) => void;
  onDeleteSource: (id: string) => void;
  onSaveEvent: (id: string, draft: EventDraft) => void;
  onSavePlace: (id: string, draft: PlaceDraft) => void;
  onApproveEvent: (id: string) => void;
  onApprovePlace: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onDeletePlace: (id: string) => void;
};

function AdminPage({
  approvedEvents,
  approvedPlaces,
  crawlSources,
  pendingEvents,
  pendingPlaces,
  crawlUrl,
  crawlType,
  statusMessage,
  isSubmitting,
  onCrawlUrlChange,
  onCrawlTypeChange,
  onCrawlSubmit,
  onRecrawl,
  onDeleteSource,
  onSaveEvent,
  onSavePlace,
  onApproveEvent,
  onApprovePlace,
  onDeleteEvent,
  onDeletePlace,
}: AdminPageProps) {
  return (
    <main className="px-6 py-6">
      <section className="mx-auto max-w-6xl space-y-8">
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Pending Review ({pendingEvents.length + pendingPlaces.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Approved ({approvedEvents.length + approvedPlaces.length})
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <MapPinned className="h-4 w-4" />
              Crawl Sources ({crawlSources.length})
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

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Edit Approved Items</CardTitle>
                <CardDescription>
                  Quickly update published events and places.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovedItemsTab
                  events={approvedEvents}
                  places={approvedPlaces}
                  onSaveEvent={onSaveEvent}
                  onSavePlace={onSavePlace}
                  onDeleteEvent={onDeleteEvent}
                  onDeletePlace={onDeletePlace}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Crawl Sources</CardTitle>
                <CardDescription>
                  Add new sources and manage saved URLs for re-crawling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CrawlSourcesTab
                  sources={crawlSources}
                  crawlUrl={crawlUrl}
                  crawlType={crawlType}
                  statusMessage={statusMessage}
                  isSubmitting={isSubmitting}
                  onCrawlUrlChange={onCrawlUrlChange}
                  onCrawlTypeChange={onCrawlTypeChange}
                  onCrawlSubmit={onCrawlSubmit}
                  onRecrawl={onRecrawl}
                  onDelete={onDeleteSource}
                />
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
    <main className="px-6 py-6">
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
  return <EventsPage />;
}

function PlacesRoute() {
  return <PlacesPage />;
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
    places,
    crawlSources,
    pendingEvents,
    pendingPlaces,
    crawlUrl,
    crawlType,
    statusMessage,
    isSubmitting,
    session,
    authError,
    authLoading,
    setCrawlUrl,
    setCrawlType,
    handleCrawlSubmit,
    handleRecrawl,
    deleteSource,
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
      approvedPlaces={places}
      crawlSources={crawlSources}
      pendingEvents={pendingEvents}
      pendingPlaces={pendingPlaces}
      crawlUrl={crawlUrl}
      crawlType={crawlType}
      statusMessage={statusMessage}
      isSubmitting={isSubmitting}
      onCrawlUrlChange={setCrawlUrl}
      onCrawlTypeChange={setCrawlType}
      onCrawlSubmit={handleCrawlSubmit}
      onRecrawl={handleRecrawl}
      onDeleteSource={deleteSource}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

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

  const crawlSourcesQuery = useQuery({
    queryKey: ["crawl_sources", session?.user.id, isAdminRoute],
    enabled: isAdminRoute && Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("crawl_sources")
        .select("*")
        .order("last_crawled_at", { ascending: false, nullsFirst: false });
      return (data ?? []) as CrawlSource[];
    },
  });

  const events = eventsQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const pendingEvents = pendingEventsQuery.data ?? [];
  const pendingPlaces = pendingPlacesQuery.data ?? [];
  const crawlSources = crawlSourcesQuery.data ?? [];

  // Check if any sources are actively crawling
  const hasActiveCrawls = crawlSources.some(
    (s) => s.crawl_status === "pending" || s.crawl_status === "crawling"
  );

  // Poll for updates when there are active crawls
  useEffect(() => {
    if (!hasActiveCrawls || !isAdminRoute || !session) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [hasActiveCrawls, isAdminRoute, session, queryClient]);

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

    // Step 1: Immediately add the source with 'pending' status
    const { error: upsertError } = await supabase.from("crawl_sources").upsert(
      {
        source_url: crawlUrl,
        source_type: crawlType,
        crawl_status: "pending",
        error_message: null,
      },
      { onConflict: "source_url,source_type" }
    );

    if (upsertError) {
      setStatusMessage(upsertError.message ?? "Failed to add source.");
      setIsSubmitting(false);
      return;
    }

    // Immediately refresh the sources list to show the pending source
    await queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
    setStatusMessage("Source added. Crawl started in background...");
    setCrawlUrl("");
    setIsSubmitting(false);

    // Step 2: Trigger the crawl in the background (don't await)
    supabase.functions
      .invoke("api/crawl", {
        method: "POST",
        body: { url: crawlUrl, type: crawlType },
      })
      .then(async () => {
        // Refresh data when crawl completes
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
          queryClient.invalidateQueries({ queryKey: ["places", "pending"] }),
          queryClient.invalidateQueries({ queryKey: ["crawl_sources"] }),
        ]);
      })
      .catch(() => {
        // Error handling is done by the backend updating crawl_status
        queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
      });
  };

  const handleRecrawl = async (source: CrawlSource) => {
    // Step 1: Immediately update status to 'pending'
    await supabase
      .from("crawl_sources")
      .update({ crawl_status: "pending", error_message: null })
      .eq("id", source.id);

    await queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
    setStatusMessage(`Re-crawl started for ${source.source_url}...`);

    // Step 2: Trigger the crawl in the background (don't await)
    supabase.functions
      .invoke("api/crawl", {
        method: "POST",
        body: { url: source.source_url, type: source.source_type },
      })
      .then(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["events", "pending"] }),
          queryClient.invalidateQueries({ queryKey: ["places", "pending"] }),
          queryClient.invalidateQueries({ queryKey: ["crawl_sources"] }),
        ]);
      })
      .catch(() => {
        queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
      });
  };

  const deleteSource = async (id: string) => {
    await supabase.from("crawl_sources").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["crawl_sources"] });
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
        price: draft.price,
        age_range: draft.age_range,
        image_url: draft.image_url,
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
    crawlSources,
    crawlUrl,
    crawlType,
    statusMessage,
    isSubmitting,
    session,
    authError,
    authLoading,
    setCrawlUrl,
    setCrawlType,
    handleCrawlSubmit,
    handleRecrawl,
    deleteSource,
    saveEvent,
    savePlace,
    approveEvent,
    approvePlace,
    deleteEvent,
    deletePlace,
    handleSignIn,
    handleSignOut,
  };

  const isEventsActive = location.pathname === "/events";
  const isPlacesActive = location.pathname === "/places";
  const isHomePage = location.pathname === "/";
  const showHeaderSearch = !isAdminRoute && !isHomePage;

  return (
    <AppDataContext.Provider value={appData}>
      <div className="min-h-screen bg-white">
        <header className="bg-muted/30 border-b border-muted px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xl font-bold text-primary">Golden</span>
            </Link>

            {/* Navigation Tabs - Center (Airbnb style) */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/events"
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  isEventsActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Events
                </div>
                {isEventsActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </Link>
              <Link
                to="/places"
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  isPlacesActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4" />
                  Places
                </div>
                {isPlacesActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </Link>
            </nav>

            {/* Right side - User Avatar or Admin link */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {session ? (
                <>
                  <Link
                    to="/admin"
                    className={`hidden sm:flex items-center gap-1 text-sm font-medium transition-colors ${
                      isAdminRoute
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Admin
                  </Link>
                  <UserAvatar
                    email={session.user.email ?? "user"}
                    onSignOut={handleSignOut}
                  />
                </>
              ) : (
                <Link to="/admin" className={navLinkInactive}>
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Filter Bar Row - Airbnb style (only on events/places pages) */}
          {showHeaderSearch && (
            <div className="mx-auto max-w-6xl mt-4">
              <div className="flex justify-center">
                <HeaderFilterBar
                  showDateFilter={isEventsActive}
                  availableTags={
                    isEventsActive
                      ? [...new Set(events.flatMap((e) => e.tags ?? []))]
                      : [...new Set(places.flatMap((p) => p.tags ?? []))]
                  }
                />
              </div>
            </div>
          )}

          {/* Mobile Navigation */}
          <nav className="mt-3 flex sm:hidden items-center justify-center gap-4">
            <Link
              to="/events"
              className={`flex items-center gap-1 text-sm font-medium ${
                isEventsActive ? navLinkActive : navLinkInactive
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Events
            </Link>
            <Link
              to="/places"
              className={`flex items-center gap-1 text-sm font-medium ${
                isPlacesActive ? navLinkActive : navLinkInactive
              }`}
            >
              <MapPinned className="h-4 w-4" />
              Places
            </Link>
            {session && (
              <Link
                to="/admin"
                className={`flex items-center gap-1 text-sm font-medium ${
                  isAdminRoute ? navLinkActive : navLinkInactive
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </header>

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
