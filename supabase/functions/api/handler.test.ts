import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createCrawlHandler } from "./handler.ts";

type CrawlJob = {
  id: string;
  firecrawl_job_id: string;
  source_url: string;
  crawl_type: "events" | "places";
  status: "pending" | "completed" | "failed";
  created_at: string;
};

const createSupabaseStub = (jobs: CrawlJob[] = []) => {
  const inserts: Array<{ table: string; payload: unknown }> = [];
  const updates: Array<{ table: string; payload: unknown }> = [];
  const from = (table: string) => ({
    insert: async (payload: unknown) => {
      inserts.push({ table, payload });
      return { error: null, data: null };
    },
    select: () => ({
      eq: async (column: string, value: string) => {
        if (table === "crawl_jobs" && column === "status") {
          return {
            data: jobs.filter((job) => job.status === value),
            error: null,
          };
        }
        return { data: [], error: null };
      },
    }),
    update: (payload: unknown) => ({
      eq: async () => {
        updates.push({ table, payload });
        return { error: null, data: null };
      },
    }),
  });

  return { client: { from }, inserts, updates };
};

Deno.test("createCrawlHandler rejects missing firecrawl API key", async () => {
  const { client } = createSupabaseStub();
  const handler = createCrawlHandler({ supabase: client });

  const request = new Request("http://localhost/api/crawl", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com", type: "events" }),
  });

  const response = await handler(request);

  assertEquals(response.status, 500);
  assertEquals(await response.json(), { error: "Missing FIRECRAWL_API_KEY" });
});

Deno.test("createCrawlHandler inserts events and crawl source", async () => {
  const { client, inserts } = createSupabaseStub();
  const handler = createCrawlHandler({
    supabase: client,
    firecrawlApiKey: "test-key",
    fetchFn: async () =>
      new Response(
        JSON.stringify({ success: true, id: "job-123" }),
        { status: 200 },
      ),
  });

  const request = new Request("http://localhost/api/crawl", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com", type: "events" }),
  });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { queued: true, jobId: "job-123" });
  assertEquals(inserts.length, 1);
  assertEquals(inserts[0].table, "crawl_jobs");
});

Deno.test("createCrawlHandler refreshes pending crawl jobs", async () => {
  const pendingJob: CrawlJob = {
    id: "job-row",
    firecrawl_job_id: "firecrawl-1",
    source_url: "https://example.com",
    crawl_type: "events",
    status: "pending",
    created_at: "2025-01-01T00:00:00Z",
  };
  const { client, inserts, updates } = createSupabaseStub([pendingJob]);
  const handler = createCrawlHandler({
    supabase: client,
    firecrawlApiKey: "test-key",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          data: {
            events: [
              {
                title: "Story Time",
                description: "Kids stories",
                start_time: "2025-01-01",
                end_time: "2025-01-01",
                location_name: "Library",
                address: "123 Main",
                website: "https://example.com",
                tags: ["kids"],
              },
            ],
          },
        }),
        { status: 200 },
      ),
  });

  const request = new Request("http://localhost/api/refresh", {
    method: "POST",
  });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    processed: 1,
    completed: 1,
    failed: 0,
    pending: 0,
    insertedEvents: 1,
    insertedPlaces: 0,
  });
  assertEquals(inserts[0].table, "events");
  assertEquals(inserts[1].table, "crawl_sources");
  assertEquals(updates.length, 1);
  assertEquals(updates[0].table, "crawl_jobs");
});
