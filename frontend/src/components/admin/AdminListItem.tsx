import { Check, MapPin, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUnsplashUrl } from "@/components/ui/listing-card";
import { cn } from "@/lib/utils";

type AdminListItemProps = {
  id: string;
  title: string;
  subtitle?: string | null;
  location?: string | null;
  details?: string | null;
  tags?: string[];
  imageUrl?: string | null;
  category: "events" | "places";
  showApprove?: boolean;
  onApprove?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
};

export function AdminListItem({
  id,
  title,
  subtitle,
  location,
  details,
  tags = [],
  imageUrl,
  category,
  showApprove = false,
  onApprove,
  onDelete,
  onClick,
  className,
}: AdminListItemProps) {
  const displayImageUrl = imageUrl || getUnsplashUrl(id, category);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl bg-card transition-all hover:shadow-lg",
        className
      )}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
        <img
          src={displayImageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {subtitle}
          </p>
        )}
        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}
        {details && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {details}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        {/* Action buttons */}
        {(showApprove || onDelete) && (
          <div className="mt-3 flex gap-2">
            {showApprove && onApprove && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove();
                }}
                className="flex-1"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Approve
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex-1 hover:bg-muted"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
