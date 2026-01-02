import { useState } from "react";
import { ArrowLeft, BadgeInfo } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, EventDraft } from "@/types";
import { EventDetailView } from "./EventDetailView";

type ApprovedEventsTabProps = {
  events: Event[];
  onSaveEvent: (id: string, draft: EventDraft) => void;
  onDeleteEvent: (id: string) => void;
};

export function ApprovedEventsTab({
  events,
  onSaveEvent,
  onDeleteEvent,
}: ApprovedEventsTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleSave = (id: string, draft: EventDraft) => {
    onSaveEvent(id, draft);
    setSelectedEvent(null);
  };

  if (selectedEvent) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedEvent(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Button>
        <EventDetailView
          event={selectedEvent}
          onSave={handleSave}
          onDelete={onDeleteEvent}
          onBack={() => setSelectedEvent(null)}
          showApproveAction={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <BadgeInfo className="h-5 w-5" />
          <p>No approved events yet.</p>
          <p className="text-sm">
            Approved events will appear here for quick edits.
          </p>
        </div>
      ) : (
        events.map((event) => (
          <Card
            key={event.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setSelectedEvent(event)}
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
                <div className="flex flex-wrap gap-2">
                  {event.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
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
    </div>
  );
}
