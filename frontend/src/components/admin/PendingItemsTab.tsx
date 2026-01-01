import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Event, EventDraft, Place, PlaceDraft } from "@/types";
import { EventDetailView } from "./EventDetailView";
import { PlaceDetailView } from "./PlaceDetailView";

type PendingItemsTabProps = {
  pendingEvents: Event[];
  pendingPlaces: Place[];
  onSaveEvent: (id: string, draft: EventDraft) => void;
  onSavePlace: (id: string, draft: PlaceDraft) => void;
  onApproveEvent: (id: string) => void;
  onApprovePlace: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onDeletePlace: (id: string) => void;
};

type SelectedItem =
  | { type: "event"; item: Event }
  | { type: "place"; item: Place }
  | null;

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
}

export function PendingItemsTab({
  pendingEvents,
  pendingPlaces,
  onSaveEvent,
  onSavePlace,
  onApproveEvent,
  onApprovePlace,
  onDeleteEvent,
  onDeletePlace,
}: PendingItemsTabProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

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
          onSave={onSaveEvent}
          onApprove={onApproveEvent}
          onDelete={onDeleteEvent}
          onBack={() => setSelectedItem(null)}
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
          onSave={onSavePlace}
          onApprove={onApprovePlace}
          onDelete={onDeletePlace}
          onBack={() => setSelectedItem(null)}
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="events" className="space-y-4">
      <TabsList>
        <TabsTrigger value="events" className="gap-2">
          <Calendar className="h-4 w-4" />
          Events ({pendingEvents.length})
        </TabsTrigger>
        <TabsTrigger value="places" className="gap-2">
          <MapPin className="h-4 w-4" />
          Places ({pendingPlaces.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="events" className="space-y-3">
        {pendingEvents.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No pending events to review.
          </p>
        ) : (
          pendingEvents.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setSelectedItem({ type: "event", item: event })}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {event.title || "Untitled Event"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.location_name || "No location"}{" "}
                      {event.start_time && `- ${event.start_time}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {event.description && (
                <CardContent className="pt-0">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="places" className="space-y-3">
        {pendingPlaces.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No pending places to review.
          </p>
        ) : (
          pendingPlaces.map((place) => (
            <Card
              key={place.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setSelectedItem({ type: "place", item: place })}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {place.name || "Untitled Place"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {place.category || "Uncategorized"}{" "}
                      {place.address && `- ${place.address}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {place.family_friendly && (
                      <Badge variant="default">Family Friendly</Badge>
                    )}
                    {place.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlace(place.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {place.description && (
                <CardContent className="pt-0">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {place.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
