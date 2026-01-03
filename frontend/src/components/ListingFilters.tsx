import { useMemo, useState } from "react";
import {
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  nextFriday,
  nextSunday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DatePreset = "today" | "this-week" | "this-weekend" | "custom";

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
    case "today":
      return {
        from: startOfDay(today),
        to: endOfDay(today),
      };
    case "this-week": {
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
      return {
        from: startOfDay(weekStart),
        to: endOfDay(weekEnd),
      };
    }
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
    case "custom":
      return null;
  }
}

function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case "today":
      return "Today";
    case "this-week":
      return "This Week";
    case "this-weekend":
      return "This Weekend";
    case "custom":
      return "Custom";
  }
}

export function getDefaultFilterParams(): FilterParams {
  return {
    datePreset: "this-week",
  };
}

type ListingFiltersProps = {
  availableTags: string[];
  showDateFilter?: boolean;
  params: FilterParams;
  onParamsChange: (params: FilterParams) => void;
};

export function ListingFilters({
  availableTags,
  showDateFilter = true,
  params,
  onParamsChange,
}: ListingFiltersProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(params.search ?? "");

  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;
  const datePreset = params.datePreset ?? "this-week";
  const selectedTags = params.tags ?? [];

  const hasActiveFilters =
    params.dateFrom ||
    params.dateTo ||
    params.search ||
    (params.tags && params.tags.length > 0);

  const handleClearFilters = () => {
    setSearchInput("");
    onParamsChange({
      datePreset: "this-week",
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

  const sortedTags = useMemo(
    () => [...availableTags].sort((a, b) => a.localeCompare(b)),
    [availableTags]
  );

  const dateButtonLabel = useMemo(() => {
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

  const hasNonDefaultFilters =
    datePreset !== "this-week" ||
    params.search ||
    (params.tags && params.tags.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {showDateFilter && (
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-auto min-w-[160px] justify-start text-left font-normal",
                  !dateFrom && !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateButtonLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="flex flex-col gap-1 border-r p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Quick select
                  </p>
                  {(["today", "this-week", "this-weekend"] as DatePreset[]).map(
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

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchSubmit}
            className="pl-9"
          />
        </div>

        {hasNonDefaultFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {sortedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
