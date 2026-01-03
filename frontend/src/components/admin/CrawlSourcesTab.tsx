import { useState } from "react";
import { ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CrawlSource } from "@/types";

type CrawlSourcesTabProps = {
  sources: CrawlSource[];
  crawlUrl: string;
  crawlType: "events" | "places";
  statusMessage: string | null;
  isSubmitting: boolean;
  onCrawlUrlChange: (value: string) => void;
  onCrawlTypeChange: (value: "events" | "places") => void;
  onCrawlSubmit: () => void;
  onRecrawl: (source: CrawlSource) => void;
  onDelete: (id: string) => void;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
}

export function CrawlSourcesTab({
  sources,
  crawlUrl,
  crawlType,
  statusMessage,
  isSubmitting,
  onCrawlUrlChange,
  onCrawlTypeChange,
  onCrawlSubmit,
  onRecrawl,
  onDelete,
}: CrawlSourcesTabProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSources = sources.filter((source) => {
    if (typeFilter !== "all" && source.source_type !== typeFilter) return false;
    if (
      searchQuery &&
      !source.source_url.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Add new source form */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-3 text-sm font-medium">Add New Source</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              value={crawlUrl}
              onChange={(e) => onCrawlUrlChange(e.target.value)}
              placeholder="https://example.com/calendar"
              className="bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={crawlType === "events" ? "default" : "outline"}
              size="sm"
              onClick={() => onCrawlTypeChange("events")}
            >
              Events
            </Button>
            <Button
              variant={crawlType === "places" ? "default" : "outline"}
              size="sm"
              onClick={() => onCrawlTypeChange("places")}
            >
              Places
            </Button>
          </div>
          <Button onClick={onCrawlSubmit} disabled={isSubmitting} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add & Crawl"}
          </Button>
        </div>
        {statusMessage && (
          <p className="mt-2 text-sm text-muted-foreground">{statusMessage}</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="places">Places</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source URL</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[180px]">Created</TableHead>
              <TableHead className="w-[180px]">Last Crawled</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No crawl sources found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {source.source_url.length > 50
                        ? `${source.source_url.substring(0, 50)}...`
                        : source.source_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.source_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(source.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(source.last_crawled_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRecrawl(source)}
                        title="Re-crawl this source"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(source.id)}
                        title="Delete this source"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredSources.length} of {sources.length} sources
      </p>
    </div>
  );
}
