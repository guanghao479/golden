import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type CrawlType = "events" | "places";

type CrawlRequest = {
  url?: string;
  type?: CrawlType;
};

type FirecrawlResponse = {
  data?: {
    events?: Array<Record<string, unknown>>;
    places?: Array<Record<string, unknown>>;
  };
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const firecrawlEndpoint = "https://api.firecrawl.dev/v1/extract";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const isCrawlEndpoint =
    url.pathname.endsWith("/crawl") || url.pathname.endsWith("/api");
  if (!isCrawlEndpoint) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = (await req.json()) as CrawlRequest;
  const targetUrl = payload.url?.trim();
  const crawlType = payload.type;

  if (!targetUrl || (crawlType !== "events" && crawlType !== "places")) {
    return new Response(JSON.stringify({ error: "Invalid request payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!firecrawlApiKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const firecrawlResponse = await fetch(firecrawlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firecrawlApiKey}`,
    },
    body: JSON.stringify({
      url: targetUrl,
      schema: schemas[crawlType],
    }),
  });

  if (!firecrawlResponse.ok) {
    return new Response(JSON.stringify({ error: "Firecrawl request failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const firecrawlPayload = (await firecrawlResponse.json()) as FirecrawlResponse;
  const data = firecrawlPayload.data ?? {};

  if (crawlType === "events") {
    const events = (data.events ?? []).map((event) => ({
      source_url: targetUrl,
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

    if (events.length > 0) {
      const { error } = await supabase.from("events").insert(events);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error: crawlError } = await supabase
      .from("crawl_sources")
      .insert({ source_url: targetUrl, source_type: "events" });
    if (crawlError) {
      return new Response(JSON.stringify({ error: crawlError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ inserted: events.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const places = (data.places ?? []).map((place) => ({
    source_url: targetUrl,
    name: String(place.name ?? ""),
    description: String(place.description ?? ""),
    category: String(place.category ?? ""),
    address: String(place.address ?? ""),
    website: String(place.website ?? ""),
    family_friendly: Boolean(place.family_friendly),
    tags: Array.isArray(place.tags) ? place.tags.map(String) : [],
    approved: false,
  }));

  if (places.length > 0) {
    const { error } = await supabase.from("places").insert(places);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { error: crawlError } = await supabase
    .from("crawl_sources")
    .insert({ source_url: targetUrl, source_type: "places" });
  if (crawlError) {
    return new Response(JSON.stringify({ error: crawlError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ inserted: places.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
