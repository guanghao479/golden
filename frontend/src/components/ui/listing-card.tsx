import * as React from "react";
import { cn } from "@/lib/utils";

type ListingCardProps = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: "events" | "places";
  imageUrl?: string | null;
  className?: string;
  onClick?: () => void;
};

// Curated Unsplash photo IDs for each category (no API key required)
// These are verified working IDs from family/kids activity photos
const UNSPLASH_PHOTOS = {
  events: [
    "photo-1533174072545-7a4b6ad7a6c3", // festival/entertainment event
    "photo-1555396273-367ea4eb4db5", // food market/family tour
    "photo-1513475382585-d06e58bcb0e0", // art workshop/creative event
    "photo-1578662996442-48f60103fc96", // camps and programs
    "photo-1530549387789-4c1017266635", // active sports event
    "photo-1581833971358-2c8b550f87b3", // educational STEM event
    "photo-1507003211169-0a1dd7228f2d", // community event
    "photo-1558618666-fcd25c85cd64", // outdoor family activity
  ],
  places: [
    "photo-1503454537195-1dcabb73ffb9", // children's museum
    "photo-1564349683136-77e08dba1ef7", // zoo animals
    "photo-1441974231531-c6227db76b6e", // nature park/forest trail
    "photo-1513475382585-d06e58bcb0e0", // art museum
    "photo-1558618666-fcd25c85cd64", // bike path/lake
    "photo-1530549387789-4c1017266635", // sports/recreation
    "photo-1578662996442-48f60103fc96", // camps/programs venue
    "photo-1507003211169-0a1dd7228f2d", // community center
  ],
};

function getUnsplashUrl(
  id: string,
  category: "events" | "places",
  size: "card" | "hero" = "card"
): string {
  const photos = UNSPLASH_PHOTOS[category];
  // Use hash of id to consistently pick the same photo for each item
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const photoId = photos[hash % photos.length];
  const dimensions = size === "hero" ? "w=800&h=400" : "w=400&h=300";
  return `https://images.unsplash.com/${photoId}?${dimensions}&fit=crop&auto=format&q=80`;
}

const ListingCard = React.forwardRef<HTMLDivElement, ListingCardProps>(
  ({ id, title, subtitle, description, category = "events", imageUrl: customImageUrl, className, onClick }, ref) => {
    // Use custom image URL if provided, otherwise fall back to Unsplash
    const imageUrl = customImageUrl || getUnsplashUrl(id, category);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group cursor-pointer rounded-xl bg-card transition-all hover:shadow-lg",
          className
        )}
      >
        <div className="aspect-[4/3] overflow-hidden rounded-xl">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="px-1 py-3">
          <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);
ListingCard.displayName = "ListingCard";

export { ListingCard, getUnsplashUrl };
