import { corsHeaders as defaultCorsHeaders } from "../_shared/cors.ts";

export type CrawlType = "events" | "places";

export type CrawlRequest = {
  url?: string;
  type?: CrawlType;
};

export type FirecrawlScrapeResponse = {
  success: boolean;
  data?: {
    json?: {
      events?: Array<Record<string, unknown>>;
      places?: Array<Record<string, unknown>>;
    };
  };
  error?: string;
};

type SupabaseInsertResult = {
  data?: unknown;
  error: { message: string } | null;
};

type SupabaseUpsertResult = {
  data?: unknown;
  error: { message: string } | null;
};

type SupabaseUpdateResult = {
  data?: unknown;
  error: { message: string } | null;
};

type SupabaseClientLike = {
  from: (table: string) => {
    insert: (payload: unknown) => Promise<SupabaseInsertResult>;
    upsert: (
      payload: unknown,
      options?: { onConflict?: string }
    ) => Promise<SupabaseUpsertResult>;
    update: (payload: unknown) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<SupabaseUpdateResult>;
      };
    };
  };
};

type CrawlHandlerOptions = {
  supabase: SupabaseClientLike;
  firecrawlApiKey?: string;
  firecrawlEndpoint?: string;
  corsHeaders?: HeadersInit;
  fetchFn?: typeof fetch;
};

const firecrawlEndpointDefault = "https://api.firecrawl.dev/v2/scrape";

const schemas = {
  events: {
    type: "object",
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            start_time: { type: "string" },
            end_time: { type: "string" },
            location_name: { type: "string" },
            address: { type: "string" },
            website: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            price: { type: "string" },
            age_range: { type: "string" },
            image_url: { type: "string" },
          },
        },
      },
    },
  },
  places: {
    type: "object",
    properties: {
      places: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            address: { type: "string" },
            website: { type: "string" },
            family_friendly: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
            price: { type: "string" },
            age_range: { type: "string" },
            image_url: { type: "string" },
          },
        },
      },
    },
  },
} satisfies Record<CrawlType, Record<string, unknown>>;

type CrawlStatus = "idle" | "pending" | "crawling" | "completed" | "failed";

const updateCrawlStatus = async (
  supabase: SupabaseClientLike,
  sourceUrl: string,
  sourceType: CrawlType,
  status: CrawlStatus,
  errorMessage?: string
) => {
  await supabase
    .from("crawl_sources")
    .update({
      crawl_status: status,
      error_message: errorMessage ?? null,
      ...(status === "completed" ? { last_crawled_at: new Date().toISOString() } : {}),
    })
    .eq("source_url", sourceUrl)
    .eq("source_type", sourceType);
};

export const createCrawlHandler = ({
  supabase,
  firecrawlApiKey,
  firecrawlEndpoint = firecrawlEndpointDefault,
  corsHeaders = defaultCorsHeaders,
  fetchFn = fetch,
}: CrawlHandlerOptions) => {
  const mapEvents = (sourceUrl: string, events: Array<Record<string, unknown>>) =>
    events.map((event) => ({
      source_url: sourceUrl,
      title: String(event.title ?? ""),
      description: String(event.description ?? ""),
      start_time: event.start_time ? String(event.start_time) : null,
      end_time: event.end_time ? String(event.end_time) : null,
      location_name: String(event.location_name ?? ""),
      address: String(event.address ?? ""),
      website: String(event.website ?? ""),
      tags: Array.isArray(event.tags) ? event.tags.map(String) : [],
      price: event.price ? String(event.price) : null,
      age_range: event.age_range ? String(event.age_range) : null,
      image_url: event.image_url ? String(event.image_url) : null,
      approved: false,
    }));

  const mapPlaces = (sourceUrl: string, places: Array<Record<string, unknown>>) =>
    places.map((place) => ({
      source_url: sourceUrl,
      name: String(place.name ?? ""),
      description: String(place.description ?? ""),
      category: String(place.category ?? ""),
      address: String(place.address ?? ""),
      website: String(place.website ?? ""),
      family_friendly: Boolean(place.family_friendly),
      tags: Array.isArray(place.tags) ? place.tags.map(String) : [],
      price: place.price ? String(place.price) : null,
      age_range: place.age_range ? String(place.age_range) : null,
      image_url: place.image_url ? String(place.image_url) : null,
      approved: false,
    }));

  return async (req: Request) => {
    const url = new URL(req.url);
    console.log(`[api] ${req.method} ${url.pathname}`);

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const isCrawlEndpoint =
      url.pathname.endsWith("/crawl") || url.pathname.endsWith("/api");

    if (!isCrawlEndpoint) {
      console.log(`[api] 404 - Not found: ${url.pathname}`);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      console.log(`[api] 405 - Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as CrawlRequest;
    const targetUrl = payload.url?.trim();
    const crawlType = payload.type;
    console.log(`[api] Crawl request: type=${crawlType}, url=${targetUrl}`);

    if (!targetUrl || (crawlType !== "events" && crawlType !== "places")) {
      console.log(`[api] 400 - Invalid request payload`);
      return new Response(JSON.stringify({ error: "Invalid request payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!firecrawlApiKey) {
      console.log(`[api] 500 - Missing FIRECRAWL_API_KEY`);
      await updateCrawlStatus(supabase, targetUrl, crawlType, "failed", "Missing FIRECRAWL_API_KEY");
      return new Response(
        JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update status to 'crawling' before starting the actual crawl
    await updateCrawlStatus(supabase, targetUrl, crawlType, "crawling");

    const firecrawlBody = {
      url: targetUrl,
      formats: [
        {
          type: "json",
          schema: schemas[crawlType],
        },
      ],
    };
    console.log(`[api] Calling Firecrawl API: ${firecrawlEndpoint}`);
    console.log(`[api] Firecrawl request body: ${JSON.stringify(firecrawlBody)}`);
    const firecrawlResponse = await fetchFn(firecrawlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify(firecrawlBody),
    });

    if (!firecrawlResponse.ok) {
      const errorBody = await firecrawlResponse.text();
      console.log(`[api] 502 - Firecrawl request failed: ${firecrawlResponse.status}`);
      console.log(`[api] Firecrawl error response: ${errorBody}`);
      await updateCrawlStatus(supabase, targetUrl, crawlType, "failed", `Firecrawl request failed: ${firecrawlResponse.status}`);
      return new Response(
        JSON.stringify({ error: "Firecrawl request failed", details: errorBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const firecrawlPayload =
      (await firecrawlResponse.json()) as FirecrawlScrapeResponse;
    console.log(`[api] Firecrawl response: ${JSON.stringify(firecrawlPayload)}`);

    if (!firecrawlPayload.success) {
      await updateCrawlStatus(supabase, targetUrl, crawlType, "failed", firecrawlPayload.error ?? "Firecrawl scrape failed");
      return new Response(
        JSON.stringify({ error: "Firecrawl scrape failed", details: firecrawlPayload.error }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const jsonData = firecrawlPayload.data?.json ?? {};
    let insertedEvents = 0;
    let insertedPlaces = 0;

    if (crawlType === "events") {
      const events = mapEvents(targetUrl, jsonData.events ?? []);
      if (events.length > 0) {
        const { error: insertError } = await supabase
          .from("events")
          .insert(events);
        if (insertError) {
          await updateCrawlStatus(supabase, targetUrl, crawlType, "failed", insertError.message);
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        insertedEvents = events.length;
      }
    } else {
      const places = mapPlaces(targetUrl, jsonData.places ?? []);
      if (places.length > 0) {
        const { error: insertError } = await supabase
          .from("places")
          .insert(places);
        if (insertError) {
          await updateCrawlStatus(supabase, targetUrl, crawlType, "failed", insertError.message);
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        insertedPlaces = places.length;
      }
    }

    // Update status to 'completed' with last_crawled_at
    await updateCrawlStatus(supabase, targetUrl, crawlType, "completed");

    console.log(`[api] 200 - Scraped ${insertedEvents} events, ${insertedPlaces} places`);
    return new Response(
      JSON.stringify({
        success: true,
        insertedEvents,
        insertedPlaces,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  };
};
