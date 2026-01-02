import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createCrawlHandler } from "./handler.ts";

const createSupabaseStub = () => {
  const inserts: Array<{ table: string; payload: unknown }> = [];
  const from = (table: string) => ({
    insert: async (payload: unknown) => {
      inserts.push({ table, payload });
      return { error: null, data: null };
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

Deno.test("createCrawlHandler scrapes and inserts events", async () => {
  const { client, inserts } = createSupabaseStub();
  const handler = createCrawlHandler({
    supabase: client,
    firecrawlApiKey: "test-key",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: {
            json: {
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
                  price: "Free",
                  age_range: "3-8 years",
                  image_url: "https://example.com/storytime.jpg",
                },
              ],
            },
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
  assertEquals(await response.json(), {
    success: true,
    insertedEvents: 1,
    insertedPlaces: 0,
  });
  assertEquals(inserts.length, 2);
  assertEquals(inserts[0].table, "events");
  assertEquals(inserts[1].table, "crawl_sources");
});

Deno.test("createCrawlHandler scrapes and inserts places", async () => {
  const { client, inserts } = createSupabaseStub();
  const handler = createCrawlHandler({
    supabase: client,
    firecrawlApiKey: "test-key",
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: {
            json: {
              places: [
                {
                  name: "Kids Museum",
                  description: "Fun for all ages",
                  category: "Museum",
                  address: "456 Oak St",
                  website: "https://museum.com",
                  family_friendly: true,
                  tags: ["indoor", "educational"],
                },
              ],
            },
          },
        }),
        { status: 200 },
      ),
  });

  const request = new Request("http://localhost/api/crawl", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com", type: "places" }),
  });

  const response = await handler(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    success: true,
    insertedEvents: 0,
    insertedPlaces: 1,
  });
  assertEquals(inserts.length, 2);
  assertEquals(inserts[0].table, "places");
  assertEquals(inserts[1].table, "crawl_sources");
});

Deno.test("createCrawlHandler handles firecrawl failure", async () => {
  const { client } = createSupabaseStub();
  const handler = createCrawlHandler({
    supabase: client,
    firecrawlApiKey: "test-key",
    fetchFn: async () =>
      new Response(
        JSON.stringify({ success: false, error: "Rate limited" }),
        { status: 200 },
      ),
  });

  const request = new Request("http://localhost/api/crawl", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com", type: "events" }),
  });

  const response = await handler(request);

  assertEquals(response.status, 502);
  const body = await response.json();
  assertEquals(body.error, "Firecrawl scrape failed");
});
