import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type EventRecord = {
  id?: string;
  source_url: string;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  address?: string | null;
  website?: string | null;
  tags?: string[];
  approved?: boolean;
  created_at?: string;
};

type PlaceRecord = {
  id?: string;
  source_url: string;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  website?: string | null;
  family_friendly?: boolean;
  tags?: string[];
  approved?: boolean;
  created_at?: string;
};

type CrawlRequest = {
  url?: string;
  type?: "events" | "places";
};

type ApproveRequest = {
  id?: string;
};

type UpdateEventRequest = {
  id?: string;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  address?: string | null;
  website?: string | null;
  tags?: string[] | null;
  approved?: boolean | null;
};

type UpdatePlaceRequest = {
  id?: string;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  website?: string | null;
  family_friendly?: boolean | null;
  tags?: string[] | null;
  approved?: boolean | null;
};

type FirecrawlResponse<T> = {
  data?: T;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const baseHeaders = {
  "Content-Type": "application/json",
};

const corsHeaders = (origin: string | null) => {
  const allowedOrigin = resolveAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
};

const resolveAllowedOrigin = (origin: string | null) => {
  if (allowedOrigins.includes("*")) {
    return "*";
  }
  if (!origin) {
    return allowedOrigins[0] ?? "";
  }
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "";
};

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...baseHeaders, ...corsHeaders(origin) },
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "missing Supabase configuration" },
      500,
      origin,
    );
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (path === "/crawl" && req.method === "POST") {
      return await handleCrawl(req, origin);
    }

    if (path === "/events") {
      if (req.method === "GET") {
        return await handleList("events", true, origin);
      }
      if (req.method === "PATCH") {
        return await handleUpdateEvent(req, origin);
      }
    }

    if (path === "/places") {
      if (req.method === "GET") {
        return await handleList("places", true, origin);
      }
      if (req.method === "PATCH") {
        return await handleUpdatePlace(req, origin);
      }
    }

    if (path === "/admin/events" && req.method === "GET") {
      return await handleList("events", false, origin);
    }

    if (path === "/admin/places" && req.method === "GET") {
      return await handleList("places", false, origin);
    }

    if (path === "/events/approve" && req.method === "PATCH") {
      return await handleApprove("events", req, origin);
    }

    if (path === "/places/approve" && req.method === "PATCH") {
      return await handleApprove("places", req, origin);
    }

    return jsonResponse({ error: "not found" }, 404, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return jsonResponse({ error: message }, 500, origin);
  }
});

async function handleCrawl(req: Request, origin: string | null) {
  const body = await parseJSON<CrawlRequest>(req);
  if (!body.url || (body.type !== "events" && body.type !== "places")) {
    return jsonResponse({ error: "missing url or invalid type" }, 400, origin);
  }

  if (!firecrawlApiKey) {
    return jsonResponse({ error: "missing FIRECRAWL_API_KEY" }, 400, origin);
  }

  if (body.type === "events") {
    const response = await fetchFirecrawl<{ events: EventSchema[] }>({
      url: body.url,
      schema: firecrawlEventSchema,
    });

    const events = (response?.events ?? []).map((item) => ({
      source_url: body.url,
      title: item.title ?? null,
      description: item.description ?? null,
      start_time: parseTime(item.start_time),
      end_time: parseTime(item.end_time),
      location_name: item.location_name ?? null,
      address: item.address ?? null,
      website: item.website ?? null,
      tags: item.tags ?? [],
      approved: false,
      created_at: new Date().toISOString(),
    } satisfies EventRecord));

    if (events.length === 0) {
      return jsonResponse([], 200, origin);
    }

    const { error } = await supabase.from("events").insert(events);
    if (error) {
      return jsonResponse({ error: error.message }, 502, origin);
    }

    return jsonResponse(events, 200, origin);
  }

  const response = await fetchFirecrawl<{ places: PlaceSchema[] }>({
    url: body.url,
    schema: firecrawlPlaceSchema,
  });

  const places = (response?.places ?? []).map((item) => ({
    source_url: body.url,
    name: item.name ?? null,
    description: item.description ?? null,
    category: item.category ?? null,
    address: item.address ?? null,
    website: item.website ?? null,
    family_friendly: item.family_friendly ?? false,
    tags: item.tags ?? [],
    approved: false,
    created_at: new Date().toISOString(),
  } satisfies PlaceRecord));

  if (places.length === 0) {
    return jsonResponse([], 200, origin);
  }

  const { error } = await supabase.from("places").insert(places);
  if (error) {
    return jsonResponse({ error: error.message }, 502, origin);
  }

  return jsonResponse(places, 200, origin);
}

async function handleList(
  table: "events" | "places",
  approved: boolean,
  origin: string | null,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("approved", approved)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonResponse({ error: error.message }, 502, origin);
  }

  return jsonResponse(data ?? [], 200, origin);
}

async function handleApprove(
  table: "events" | "places",
  req: Request,
  origin: string | null,
) {
  const body = await parseJSON<ApproveRequest>(req);
  if (!body.id) {
    return jsonResponse({ error: "missing id" }, 400, origin);
  }

  const { error } = await supabase
    .from(table)
    .update({ approved: true })
    .eq("id", body.id);

  if (error) {
    return jsonResponse({ error: error.message }, 502, origin);
  }

  return jsonResponse({ status: "approved" }, 200, origin);
}

async function handleUpdateEvent(req: Request, origin: string | null) {
  const body = await parseJSON<UpdateEventRequest>(req);
  if (!body.id) {
    return jsonResponse({ error: "missing id" }, 400, origin);
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.start_time !== undefined) {
    updates.start_time = body.start_time === "" || body.start_time === null
      ? null
      : parseTimeStrict(body.start_time);
  }
  if (body.end_time !== undefined) {
    updates.end_time = body.end_time === "" || body.end_time === null
      ? null
      : parseTimeStrict(body.end_time);
  }
  if (body.location_name !== undefined) updates.location_name = body.location_name;
  if (body.address !== undefined) updates.address = body.address;
  if (body.website !== undefined) updates.website = body.website;
  if (body.tags !== undefined) updates.tags = body.tags ?? [];
  if (body.approved !== undefined) updates.approved = body.approved;

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", body.id);

  if (error) {
    return jsonResponse({ error: error.message }, 502, origin);
  }

  return jsonResponse({ status: "updated" }, 200, origin);
}

async function handleUpdatePlace(req: Request, origin: string | null) {
  const body = await parseJSON<UpdatePlaceRequest>(req);
  if (!body.id) {
    return jsonResponse({ error: "missing id" }, 400, origin);
  }

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.address !== undefined) updates.address = body.address;
  if (body.website !== undefined) updates.website = body.website;
  if (body.family_friendly !== undefined) {
    updates.family_friendly = body.family_friendly;
  }
  if (body.tags !== undefined) updates.tags = body.tags ?? [];
  if (body.approved !== undefined) updates.approved = body.approved;

  const { error } = await supabase
    .from("places")
    .update(updates)
    .eq("id", body.id);

  if (error) {
    return jsonResponse({ error: error.message }, 502, origin);
  }

  return jsonResponse({ status: "updated" }, 200, origin);
}

async function parseJSON<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error("invalid request");
  }
}

function jsonResponse(payload: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...baseHeaders, ...corsHeaders(origin) },
  });
}

function parseTime(value?: string | null): string | null {
  if (!value) return null;

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
  if (match) {
    const date = new Date(`${match[1]}T${match[2]}:00Z`);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function parseTimeStrict(value?: string | null): string {
  if (!value) return "";

  const parsed = parseTime(value);
  if (!parsed) {
    throw new Error("invalid time format");
  }
  return parsed;
}

type EventSchema = {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  address?: string;
  website?: string;
  tags?: string[];
};

type PlaceSchema = {
  name?: string;
  description?: string;
  category?: string;
  address?: string;
  website?: string;
  family_friendly?: boolean;
  tags?: string[];
};

const firecrawlEventSchema = {
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
} as const;

const firecrawlPlaceSchema = {
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
} as const;

async function fetchFirecrawl<T>(payload: {
  url: string;
  schema: Record<string, unknown>;
}): Promise<T | null> {
  const response = await fetch("https://api.firecrawl.dev/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firecrawlApiKey}`,
    },
    body: JSON.stringify({
      url: payload.url,
      schema: payload.schema,
    }),
  });

  if (!response.ok) {
    throw new Error("firecrawl request failed");
  }

  const data = (await response.json()) as FirecrawlResponse<T>;
  if (!data.data) {
    throw new Error("empty firecrawl response");
  }

  return data.data;
}
