import { useMemo, useState } from "react";
import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  nextFriday,
  nextSunday,
  startOfDay,
} from "date-fns";
import { CalendarIcon, Search, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DatePreset = "any" | "today" | "this-weekend" | "next-7-days" | "next-30-days" | "custom";

export type FilterParams = {
  dateFrom?: string;
  dateTo?: string;
  datePreset?: DatePreset;
  search?: string;
  tags?: string[];
};

type DateRange = {
  from: Date;
  to: Date;
};

export function getDateRangeForPreset(preset: DatePreset): DateRange | null {
  const today = new Date();

  switch (preset) {
    case "any":
      return null;
    case "today":
      return {
        from: startOfDay(today),
        to: endOfDay(today),
      };
    case "this-weekend": {
      const dayOfWeek = today.getDay();
      let friday: Date;
      let sunday: Date;

      if (dayOfWeek === 5) {
        friday = today;
        sunday = nextSunday(today);
      } else if (dayOfWeek === 6) {
        friday = today;
        sunday = nextSunday(today);
      } else if (dayOfWeek === 0) {
        friday = today;
        sunday = today;
      } else {
        friday = nextFriday(today);
        sunday = nextSunday(today);
      }

      return {
        from: startOfDay(friday),
        to: endOfDay(sunday),
      };
    }
    case "next-7-days":
      return {
        from: startOfDay(today),
        to: endOfDay(addDays(today, 6)),
      };
    case "next-30-days":
      return {
        from: startOfDay(today),
        to: endOfDay(addDays(today, 29)),
      };
    case "custom":
      return null;
  }
}

function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case "any":
      return "Any Date";
    case "today":
      return "Today";
    case "this-weekend":
      return "This Weekend";
    case "next-7-days":
      return "This Week";
    case "next-30-days":
      return "This Month";
    case "custom":
      return "Custom";
  }
}

export function getDefaultFilterParams(): FilterParams {
  return {
    datePreset: "next-30-days",
  };
}

type ItemType = "events" | "places";

type ListingFiltersProps = {
  availableTags: string[];
  showDateFilter?: boolean;
  params: FilterParams;
  onParamsChange: (params: FilterParams) => void;
  // Item type toggle props (optional)
  itemType?: ItemType;
  onItemTypeChange?: (type: ItemType) => void;
  eventCount?: number;
  placeCount?: number;
};

export function ListingFilters({
  availableTags,
  showDateFilter = true,
  params,
  onParamsChange,
  itemType,
  onItemTypeChange,
  eventCount,
  placeCount,
}: ListingFiltersProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(params.search ?? "");

  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;
  const datePreset = params.datePreset ?? "next-30-days";
  const selectedTags = params.tags ?? [];

  const handleClearFilters = () => {
    setSearchInput("");
    onParamsChange({
      datePreset: "next-30-days",
    });
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const range = getDateRangeForPreset(preset);
    onParamsChange({
      ...params,
      dateFrom: range?.from.toISOString(),
      dateTo: range?.to.toISOString(),
      datePreset: preset,
    });
    if (preset !== "custom") {
      setDatePopoverOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    onParamsChange({
      ...params,
      search: searchInput || undefined,
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onParamsChange({
      ...params,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleItemTypeChange = (value: string) => {
    if (onItemTypeChange && (value === "events" || value === "places")) {
      onItemTypeChange(value);
    }
  };

  const sortedTags = useMemo(
    () => [...availableTags].sort((a, b) => a.localeCompare(b)),
    [availableTags]
  );

  const dateButtonLabel = useMemo(() => {
    if (datePreset === "any") {
      return "Any Date";
    }
    if (datePreset !== "custom") {
      return getPresetLabel(datePreset);
    }
    if (dateFrom && dateTo) {
      if (isSameDay(dateFrom, dateTo)) {
        return format(dateFrom, "MMM d, yyyy");
      }
      return `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}`;
    }
    if (dateFrom) {
      return `From ${format(dateFrom, "MMM d, yyyy")}`;
    }
    if (dateTo) {
      return `Until ${format(dateTo, "MMM d, yyyy")}`;
    }
    return "Select dates";
  }, [dateFrom, dateTo, datePreset]);

  const tagsButtonLabel = useMemo(() => {
    if (selectedTags.length === 0) {
      return "Tags";
    }
    if (selectedTags.length === 1) {
      return selectedTags[0];
    }
    return `${selectedTags.length} tags`;
  }, [selectedTags]);

  const hasNonDefaultFilters =
    (datePreset !== "next-30-days" && datePreset !== "any") ||
    params.search ||
    (params.tags && params.tags.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {itemType && onItemTypeChange && (
          <Tabs value={itemType} onValueChange={handleItemTypeChange} className="flex-shrink-0">
            <TabsList className="h-9">
              <TabsTrigger value="events" className="text-sm px-3">
                Events{eventCount !== undefined && ` (${eventCount})`}
              </TabsTrigger>
              <TabsTrigger value="places" className="text-sm px-3">
                Places{placeCount !== undefined && ` (${placeCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {showDateFilter && (
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-auto min-w-[120px] justify-start text-left font-medium text-sm"
              >
                <CalendarIcon className="mr-1.5 h-4 w-4" />
                {dateButtonLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
                        {getPresetLabel(preset)}
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
                      onParamsChange({
                        ...params,
                        dateFrom: range?.from?.toISOString(),
                        dateTo: range?.to?.toISOString(),
                        datePreset: "custom",
                      });
                    }}
                    numberOfMonths={1}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="relative min-w-[140px] max-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchSubmit}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "h-9 w-auto min-w-[80px] justify-start text-left font-medium text-sm",
                selectedTags.length > 0 && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Tag className="mr-1.5 h-4 w-4" />
              {tagsButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
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
                onClick={() => onParamsChange({ ...params, tags: undefined })}
              >
                Clear tags
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {hasNonDefaultFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
