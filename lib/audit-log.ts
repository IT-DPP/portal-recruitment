import prisma from "./prisma";

export type AuditActionType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGIN_RATE_LIMITED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_PASSWORD_RESET"
  | "USER_DELETED"
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "JOB_PUBLISHED"
  | "STAGE_MOVED"
  | "CANDIDATE_BLACKLISTED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_ACCESSED";

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: AuditActionType | string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

const SENSITIVE_KEYS = new Set(["password", "token", "secret", "base64", "access_token", "refresh_token"]);

/**
 * Strip sensitive keys from metadata before persisting to AuditLog (UU PDP & §0.7 compliance).
 */
export function sanitizeAuditMetadata(
  metadata?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Record an audit log entry safely. Never throws to avoid breaking primary business flows.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const cleanMetadata = sanitizeAuditMetadata(input.metadata);
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        actorEmail: input.actorEmail || null,
        actorRole: input.actorRole || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        metadata: cleanMetadata ? (cleanMetadata as any) : undefined,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (error) {
    console.warn("[AuditLog] Failed to record audit entry:", error);
  }
}
