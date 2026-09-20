import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createClient } from "@/lib/server/authorization";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user, "logs.view") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const offset = (page - 1) * limit;

  const actorUsername = url.searchParams.get("actor") || "";
  const action = url.searchParams.get("action") || "";
  const resourceType = url.searchParams.get("resource") || "";
  const dateFrom = url.searchParams.get("from") || "";
  const dateTo = url.searchParams.get("to") || "";
  const search = url.searchParams.get("search") || "";

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("agency_id", user.agencyId);

  if (actorUsername) {
    query = query.ilike("actor_username", `%${actorUsername}%`);
  }
  if (action) {
    query = query.eq("action", action);
  }
  if (resourceType) {
    query = query.eq("resource_type", resourceType);
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59");
  }
  if (search) {
    query = query.or(`description.ilike.%${search}%,actor_username.ilike.%${search}%,resource_id.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logs = (data || []).map((log: Record<string, unknown>) => ({
    id: log.id,
    agencyId: log.agency_id,
    actorUserId: log.actor_user_id,
    actorUsername: log.actor_username,
    action: log.action,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    description: log.description,
    beforeData: log.before_data,
    afterData: log.after_data,
    metadata: log.metadata,
    createdAt: log.created_at,
  }));

  return NextResponse.json({
    logs,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
