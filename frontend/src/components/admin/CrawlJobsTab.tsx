import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { CrawlJob } from "@/types";

type CrawlJobsTabProps = {
  jobs: CrawlJob[];
};

function getStatusBadgeVariant(status: CrawlJob["status"]) {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
}

export function CrawlJobsTab({ jobs }: CrawlJobsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (typeFilter !== "all" && job.crawl_type !== typeFilter) return false;
    if (
      searchQuery &&
      !job.source_url.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !job.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by URL or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[180px]">Created</TableHead>
              <TableHead className="w-[180px]">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No crawl jobs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {job.source_url.length > 50
                        ? `${job.source_url.substring(0, 50)}...`
                        : job.source_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {job.error_message && (
                      <p className="mt-1 text-xs text-destructive">
                        {job.error_message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.crawl_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(job.completed_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredJobs.length} of {jobs.length} jobs
      </p>
    </div>
  );
}
