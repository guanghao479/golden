import { corsHeaders as defaultCorsHeaders } from "../_shared/cors.ts";

export type CrawlType = "events" | "places";

export type CrawlRequest = {
  url?: string;
  type?: CrawlType;
};

export type FirecrawlQueueResponse = {
  success?: boolean;
  id?: string;
};

export type FirecrawlJobStatus = {
  success: boolean;
  status: "completed" | "failed" | "processing";
  data?: {
    events?: Array<Record<string, unknown>>;
    places?: Array<Record<string, unknown>>;
  };
  error?: string;
};

export type CrawlJob = {
  id: string;
  firecrawl_job_id: string;
  source_url: string;
  crawl_type: CrawlType;
  status: "pending" | "completed" | "failed";
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
};

type SupabaseInsertResult = {
  data?: unknown;
  error: { message: string } | null;
};

type SupabaseSelectResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseClientLike = {
  from: (table: string) => {
    insert: (payload: unknown) => Promise<SupabaseInsertResult>;
    select: (columns?: string) => {
      eq: (column: string, value: string) => Promise<SupabaseSelectResult<CrawlJob[]>>;
    };
    update: (payload: unknown) => {
      eq: (column: string, value: string) => Promise<SupabaseInsertResult>;
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

const firecrawlEndpointDefault = "https://api.firecrawl.dev/v2/extract";

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
          },
        },
      },
    },
  },
} satisfies Record<CrawlType, Record<string, unknown>>;

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
    const isRefreshEndpoint =
      url.pathname.endsWith("/refresh") || url.pathname.endsWith("/jobs/refresh");

    if (!isCrawlEndpoint && !isRefreshEndpoint) {
      console.log(`[api] 404 - Not found: ${url.pathname}`);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isRefreshEndpoint) {
      if (req.method !== "POST" && req.method !== "GET") {
        console.log(`[api] 405 - Method not allowed: ${req.method}`);
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!firecrawlApiKey) {
        console.log(`[api] 500 - Missing FIRECRAWL_API_KEY`);
        return new Response(
          JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: jobs, error } = await supabase
        .from("crawl_jobs")
        .select("*")
        .eq("status", "pending");

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pendingJobs = jobs ?? [];
      let processed = 0;
      let completed = 0;
      let failed = 0;
      let pending = 0;
      let insertedEvents = 0;
      let insertedPlaces = 0;

      for (const job of pendingJobs) {
        processed += 1;
        const jobStatusResponse = await fetchFn(
          `${firecrawlEndpoint}/${job.firecrawl_job_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${firecrawlApiKey}`,
            },
          },
        );

        if (!jobStatusResponse.ok) {
          const errorBody = await jobStatusResponse.text();
          await supabase.from("crawl_jobs").update({
            status: "failed",
            error_message: `Firecrawl status failed: ${jobStatusResponse.status}`,
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);
          failed += 1;
          console.log(
            `[api] Firecrawl status error for job ${job.id}: ${errorBody}`,
          );
          continue;
        }

        const jobStatus =
          (await jobStatusResponse.json()) as FirecrawlJobStatus;
        console.log(
          `[api] Firecrawl job status ${job.firecrawl_job_id}: ${JSON.stringify(jobStatus)}`,
        );

        if (jobStatus.status === "processing") {
          pending += 1;
          continue;
        }

        if (jobStatus.status === "failed") {
          await supabase.from("crawl_jobs").update({
            status: "failed",
            error_message: jobStatus.error ?? "Firecrawl job failed",
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);
          failed += 1;
          continue;
        }

        const data = jobStatus.data ?? {};

        if (job.crawl_type === "events") {
          const events = mapEvents(job.source_url, data.events ?? []);
          if (events.length > 0) {
            const { error: insertError } = await supabase
              .from("events")
              .insert(events);
            if (insertError) {
              await supabase.from("crawl_jobs").update({
                status: "failed",
                error_message: insertError.message,
                completed_at: new Date().toISOString(),
              }).eq("id", job.id);
              failed += 1;
              continue;
            }
          }
          insertedEvents += events.length;
        } else {
          const places = mapPlaces(job.source_url, data.places ?? []);
          if (places.length > 0) {
            const { error: insertError } = await supabase
              .from("places")
              .insert(places);
            if (insertError) {
              await supabase.from("crawl_jobs").update({
                status: "failed",
                error_message: insertError.message,
                completed_at: new Date().toISOString(),
              }).eq("id", job.id);
              failed += 1;
              continue;
            }
          }
          insertedPlaces += places.length;
        }

        const { error: crawlError } = await supabase
          .from("crawl_sources")
          .insert({
            source_url: job.source_url,
            source_type: job.crawl_type,
          });
        if (crawlError) {
          await supabase.from("crawl_jobs").update({
            status: "failed",
            error_message: crawlError.message,
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);
          failed += 1;
          continue;
        }

        const { error: updateError } = await supabase.from("crawl_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          error_message: null,
        }).eq("id", job.id);

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        completed += 1;
      }

      return new Response(
        JSON.stringify({
          processed,
          completed,
          failed,
          pending,
          insertedEvents,
          insertedPlaces,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      return new Response(
        JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const firecrawlBody = {
      urls: [targetUrl],
      schema: schemas[crawlType],
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
      return new Response(
        JSON.stringify({ error: "Firecrawl request failed", details: errorBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const firecrawlPayload =
      (await firecrawlResponse.json()) as FirecrawlQueueResponse;
    console.log(`[api] Firecrawl response: ${JSON.stringify(firecrawlPayload)}`);

    if (!firecrawlPayload.id) {
      return new Response(
        JSON.stringify({ error: "Firecrawl did not return a job id" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: crawlJobError } = await supabase
      .from("crawl_jobs")
      .insert({
        firecrawl_job_id: firecrawlPayload.id,
        source_url: targetUrl,
        crawl_type: crawlType,
        status: "pending",
      });

    if (crawlJobError) {
      return new Response(JSON.stringify({ error: crawlJobError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[api] 200 - Queued job ${firecrawlPayload.id}`);
    return new Response(
      JSON.stringify({ queued: true, jobId: firecrawlPayload.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  };
};
