import { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogParams {
  supabase: SupabaseClient;
  agencyId: string;
  actorUserId: string;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  const {
    supabase,
    agencyId,
    actorUserId,
    actorUsername,
    action,
    resourceType,
    resourceId,
    description,
    beforeData,
    afterData,
    metadata,
  } = params;

  const { error } = await supabase.from("audit_logs").insert({
    agency_id: agencyId,
    actor_user_id: actorUserId,
    actor_username: actorUsername,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    description,
    before_data: beforeData || null,
    after_data: afterData || null,
    metadata: metadata || null,
  });

  if (error) {
    console.error("[audit] Failed to write audit log:", error.code, error.message);
  }
}
