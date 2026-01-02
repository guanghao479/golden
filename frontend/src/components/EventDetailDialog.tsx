import { CalendarDays, Clock, DollarSign, ExternalLink, MapPin, Tag, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUnsplashUrl } from "@/components/ui/listing-card";
import { formatEventDatetime } from "@/lib/utils";
import type { Event } from "@/types";

type EventDetailDialogProps = {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDateRange(startTime: string | null, endTime: string | null): string {
  if (!startTime) return "Date to be announced";

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return "Date to be announced";

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };

  const startDate = start.toLocaleDateString("en-US", dateOptions);

  if (!endTime) return startDate;

  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return startDate;

  const endDate = end.toLocaleDateString("en-US", dateOptions);

  if (startDate === endDate) return startDate;

  return `${startDate} — ${endDate}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return null;

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const startTimeStr = start.toLocaleTimeString("en-US", timeOptions);

  if (!endTime) return startTimeStr;

  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return startTimeStr;

  const endTimeStr = end.toLocaleTimeString("en-US", timeOptions);

  return `${startTimeStr} – ${endTimeStr}`;
}

export function EventDetailDialog({ event, open, onOpenChange }: EventDetailDialogProps) {
  if (!event) return null;

  // Use event's image_url if available, otherwise fall back to Unsplash
  const imageUrl = event.image_url || getUnsplashUrl(event.id, "events", "hero");
  const dateRange = formatDateRange(event.start_time, event.end_time);
  const timeRange = formatTimeRange(event.start_time, event.end_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0">
        {/* Hero Image */}
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-t-xl">
          <img
            src={imageUrl}
            alt={event.title || "Event"}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {event.title || "Untitled Event"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-base text-muted-foreground">
              {formatEventDatetime(event.start_time, event.end_time)}
            </DialogDescription>
          </div>

          {/* Key Details */}
          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
            {/* When */}
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">When</p>
                <p className="text-sm text-muted-foreground">{dateRange}</p>
                {timeRange && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    {timeRange}
                  </p>
                )}
              </div>
            </div>

            {/* Where */}
            {(event.location_name || event.address) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Where</p>
                  {event.location_name && (
                    <p className="text-sm text-muted-foreground">{event.location_name}</p>
                  )}
                  {event.address && (
                    <p className="text-sm text-muted-foreground">{event.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            {event.price && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Price</p>
                  <p className="text-sm text-muted-foreground">{event.price}</p>
                </div>
              </div>
            )}

            {/* Age Range */}
            {event.age_range && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Recommended Ages</p>
                  <p className="text-sm text-muted-foreground">{event.age_range}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Event Type</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">About This Event</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Actions */}
          {event.website && (
            <div className="pt-2">
              <Button asChild className="w-full">
                <a href={event.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
