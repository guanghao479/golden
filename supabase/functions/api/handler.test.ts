import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createCrawlHandler } from "./handler.ts";

const createSupabaseStub = () => {
  const inserts: Array<{ table: string; payload: unknown }> = [];
  const from = (table: string) => ({
    insert: async (payload: unknown) => {
      inserts.push({ table, payload });
      return { error: null };
    },
  });

  return { client: { from }, inserts };
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
        JSON.stringify({
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

  const request = new Request("http://localhost/api/crawl", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com", type: "events" }),
  });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { inserted: 1 });
  assertEquals(inserts.length, 2);
  assertEquals(inserts[0].table, "events");
  assertEquals(inserts[1].table, "crawl_sources");
});
