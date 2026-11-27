import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export type AllowedRole = "ADMIN" | "RECRUITER" | "CANDIDATE" | "USER";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: AllowedRole;
}

export type AuthGuardResult =
  | {
      authorized: true;
      user: AuthenticatedUser;
    }
  | {
      authorized: false;
      status: 401 | 403;
      error: string;
    };

export const STAFF_ROLES: AllowedRole[] = ["ADMIN", "RECRUITER"];

/**
 * Verify that an incoming request/action has an active session with one of the allowed roles.
 */
export async function requireRole(allowedRoles: AllowedRole[]): Promise<AuthGuardResult> {
  const session = await getServerSession(authOptions);
  const rawUser = session?.user as Record<string, unknown> | undefined;
  const userId = typeof rawUser?.id === "string" ? rawUser.id : undefined;
  const userRole = typeof rawUser?.role === "string" ? (rawUser.role as AllowedRole) : undefined;

  if (!session || !rawUser || !userId || !userRole) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Sesi tidak valid atau telah berakhir.",
    };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: Anda tidak memiliki hak akses untuk operasi ini.",
    };
  }

  return {
    authorized: true,
    user: {
      id: userId,
      email: typeof rawUser.email === "string" ? rawUser.email : null,
      name: typeof rawUser.name === "string" ? rawUser.name : null,
      role: userRole,
    },
  };
}

/**
 * Require internal staff role (ADMIN or RECRUITER).
 */
export async function requireStaffSession(): Promise<AuthGuardResult> {
  return requireRole(STAFF_ROLES);
}

/**
 * Require Super Admin role (ADMIN).
 */
export async function requireAdminSession(): Promise<AuthGuardResult> {
  return requireRole(["ADMIN"]);
}

/**
 * Validate whether a user is allowed to access a given S3/R2 object key.
 * - Internal staff (ADMIN, RECRUITER) can access all recruitment documents.
 * - Candidates can only access objects within their own namespace (`candidates/<userId>/...`)
 *   or explicitly owned by their CandidateProfile.
 */
export function isObjectKeyOwnedByUser(objectKey: string, userId: string): boolean {
  if (!objectKey || !userId) return false;
  const normalized = objectKey.replace(/^\/+/, "");
  if (normalized.includes("..")) return false;
  return normalized.startsWith(`candidates/${userId}/`);
}

/**
 * Validate whether an application document key (such as Offering Letter, MCU Pengantar, etc.)
 * belongs to a candidate's profile or their job application.
 */
export function isApplicationKeyOwnedByCandidate(
  objectKey: string,
  candidateProfileId: string,
  applicationIds: string[] = []
): boolean {
  if (!objectKey || !candidateProfileId) return false;
  const normalized = objectKey.replace(/^\/+/, "");
  if (normalized.includes("..")) return false;
  if (!normalized.startsWith("applications/")) return false;

  const segments = normalized.split("/");
  const targetId = segments[2];
  if (!targetId) return false;

  return targetId === candidateProfileId || applicationIds.includes(targetId);
}

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const ALLOWED_UPLOAD_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateUploadMetadata(
  fileName: string,
  contentType: string,
  sizeBytes?: number
): { valid: true; extension: string } | { valid: false; error: string } {
  if (!fileName || !contentType) {
    return { valid: false, error: "Nama file dan tipe dokumen wajib diisi." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: "Ekstensi file tidak diizinkan. Gunakan PDF, JPG, atau PNG.",
    };
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(contentType.toLowerCase())) {
    return {
      valid: false,
      error: "Tipe file tidak diizinkan. Gunakan PDF, JPG, atau PNG.",
    };
  }

  if (typeof sizeBytes === "number" && sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: "Ukuran file melebihi batas maksimal 5 MB.",
    };
  }

  return { valid: true, extension: ext };
}
