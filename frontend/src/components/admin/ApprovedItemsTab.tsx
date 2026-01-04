import { useMemo, useState } from "react";
import { ArrowLeft, BadgeInfo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListingFilters, FilterParams, getDateRangeForPreset } from "@/components/ListingFilters";
import type { Event, EventDraft, Place, PlaceDraft } from "@/types";
import { AdminListItem } from "./AdminListItem";
import { EventDetailView } from "./EventDetailView";
import { PlaceDetailView } from "./PlaceDetailView";

type ApprovedItemsTabProps = {
  events: Event[];
  places: Place[];
  onSaveEvent: (id: string, draft: EventDraft) => void;
  onSavePlace: (id: string, draft: PlaceDraft) => void;
  onDeleteEvent: (id: string) => void;
  onDeletePlace: (id: string) => void;
};

type SelectedItem =
  | { type: "event"; item: Event }
  | { type: "place"; item: Place }
  | null;

type ItemType = "events" | "places";

function formatEventDate(event: Event) {
  if (event.start_time) {
    return new Date(event.start_time).toLocaleDateString();
  }
  return undefined;
}


function extractTags<T extends { tags?: string[] }>(items: T[]): string[] {
  const tagSet = new Set<string>();
  items.forEach((item) => {
    item.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet);
}

function filterEvents(events: Event[], params: FilterParams): Event[] {
  return events.filter((event) => {
    // Date filter (skip if "any" preset or no dates set)
    if (params.dateFrom && params.dateTo && params.datePreset !== "any") {
      const eventStart = event.start_time ? new Date(event.start_time) : null;
      const eventEnd = event.end_time ? new Date(event.end_time) : eventStart;
      const rangeStart = new Date(params.dateFrom);
      const rangeEnd = new Date(params.dateTo);

      if (eventEnd && eventStart) {
        // Event must overlap with the range
        if (eventEnd < rangeStart || eventStart > rangeEnd) {
          return false;
        }
      }
    }

    // Search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const title = (event.title || "").toLowerCase();
      const description = (event.description || "").toLowerCase();
      if (!title.includes(searchLower) && !description.includes(searchLower)) {
        return false;
      }
    }

    // Tag filter
    if (params.tags && params.tags.length > 0) {
      const eventTags = event.tags || [];
      if (!params.tags.every((tag) => eventTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

function filterPlaces(places: Place[], params: FilterParams): Place[] {
  return places.filter((place) => {
    // Search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const name = (place.name || "").toLowerCase();
      const description = (place.description || "").toLowerCase();
      if (!name.includes(searchLower) && !description.includes(searchLower)) {
        return false;
      }
    }

    // Tag filter
    if (params.tags && params.tags.length > 0) {
      const placeTags = place.tags || [];
      if (!params.tags.every((tag) => placeTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

export function ApprovedItemsTab({
  events,
  places,
  onSaveEvent,
  onSavePlace,
  onDeleteEvent,
  onDeletePlace,
}: ApprovedItemsTabProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [itemType, setItemType] = useState<ItemType>("events");
  const [filterParams, setFilterParams] = useState<FilterParams>({ datePreset: "any" });

  const eventTags = useMemo(() => extractTags(events), [events]);
  const placeTags = useMemo(() => extractTags(places), [places]);
  const availableTags = itemType === "events" ? eventTags : placeTags;

  // Apply date preset if set
  const effectiveParams = useMemo(() => {
    if (filterParams.datePreset && filterParams.datePreset !== "custom" && filterParams.datePreset !== "any" && !filterParams.dateFrom) {
      const range = getDateRangeForPreset(filterParams.datePreset);
      if (range) {
        return {
          ...filterParams,
          dateFrom: range.from.toISOString(),
          dateTo: range.to.toISOString(),
        };
      }
    }
    return filterParams;
  }, [filterParams]);

  const filteredEvents = useMemo(
    () => filterEvents(events, effectiveParams),
    [events, effectiveParams]
  );

  const filteredPlaces = useMemo(
    () => filterPlaces(places, effectiveParams),
    [places, effectiveParams]
  );

  const handleTypeChange = (type: "events" | "places") => {
    setItemType(type);
    // Reset filters when switching types
    setFilterParams({ datePreset: "any" });
  };

  const handleSaveEvent = (id: string, draft: EventDraft) => {
    onSaveEvent(id, draft);
    setSelectedItem(null);
  };

  const handleSavePlace = (id: string, draft: PlaceDraft) => {
    onSavePlace(id, draft);
    setSelectedItem(null);
  };

  if (selectedItem?.type === "event") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedItem(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Button>
        <EventDetailView
          event={selectedItem.item}
          onSave={handleSaveEvent}
          onDelete={onDeleteEvent}
          onBack={() => setSelectedItem(null)}
          showApproveAction={false}
        />
      </div>
    );
  }

  if (selectedItem?.type === "place") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedItem(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Button>
        <PlaceDetailView
          place={selectedItem.item}
          onSave={handleSavePlace}
          onDelete={onDeletePlace}
          onBack={() => setSelectedItem(null)}
          showApproveAction={false}
        />
      </div>
    );
  }

  const totalItems = events.length + places.length;

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
        <BadgeInfo className="h-5 w-5" />
        <p>No approved items yet.</p>
        <p className="text-sm">
          Approved events and places will appear here for quick edits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ListingFilters
        availableTags={availableTags}
        showDateFilter={itemType === "events"}
        params={filterParams}
        onParamsChange={setFilterParams}
        itemType={itemType}
        onItemTypeChange={handleTypeChange}
        eventCount={events.length}
        placeCount={places.length}
      />

      {itemType === "events" ? (
        <>
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <BadgeInfo className="h-5 w-5" />
              <p>No approved events yet.</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No events match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredEvents.map((event) => (
                <AdminListItem
                  key={event.id}
                  id={event.id}
                  title={event.title || "Untitled Event"}
                  subtitle={formatEventDate(event)}
                  location={event.location_name}
                  details={event.price || undefined}
                  tags={event.tags}
                  imageUrl={event.image_url}
                  category="events"
                  onDelete={() => onDeleteEvent(event.id)}
                  onClick={() => setSelectedItem({ type: "event", item: event })}
                />
              ))}
            </div>
          )}

          {events.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}
        </>
      ) : (
        <>
          {places.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <BadgeInfo className="h-5 w-5" />
              <p>No approved places yet.</p>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No places match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredPlaces.map((place) => (
                <AdminListItem
                  key={place.id}
                  id={place.id}
                  title={place.name || "Untitled Place"}
                  subtitle={place.category}
                  location={place.address}
                  tags={place.tags}
                  imageUrl={place.image_url}
                  category="places"
                  onDelete={() => onDeletePlace(place.id)}
                  onClick={() => setSelectedItem({ type: "place", item: place })}
                />
              ))}
            </div>
          )}

          {places.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredPlaces.length} of {places.length} places
            </p>
          )}
        </>
      )}
    </div>
  );
}
