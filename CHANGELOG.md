# Changelog

All notable changes to the **DPP Recruitment Portal Dashboard** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Phase 3 (MVP Polish, Audit Log, Login Rate-Limiting & R2 Storage Consolidation) — 2026-11-03

### Added
- `AuditLog` model in `prisma/schema.prisma` and migration `20261103043000_add_audit_log`.
- `lib/audit-log.ts` service with automatic sensitive-field redaction (`sanitizeAuditMetadata`) and fail-safe logging (`recordAuditLog`).
- `app/api/audit-logs/route.ts` and `/dashboard/settings/audit-logs` Admin UI with search, action filtering, and CSV export (`§4.9` & `§8` Brief).
- `lib/rate-limit.ts` in-memory brute-force protection integrated into NextAuth `CredentialsProvider` (`5` failed attempts / `15` minutes lockout).

### Changed
- `lib/s3.ts` and `app/actions/upload.ts`: routed `uploadBase64File` directly to Cloudflare R2 / S3 (`uploadBufferToS3`) with protected `/api/file?key=...` URLs when S3 is configured, and skipped `CreateBucketCommand` on non-local endpoints to support least-privilege R2 tokens (`ADR-004`).
- `app/dashboard/settings/users/page.tsx` & `app/api/users/[id]/route.ts`: enabled Super Admin to edit user email, name, department, role, and reset passwords (including primary admin password rotation) with uniqueness and $\ge 8$ character validation.
- Expanded unit test suite in `lib/__tests__/security-foundation.test.ts` to 6 passing tests.

## [Phase 2] — Foundation, Security Hardening & Docker Alignment — 2026-11-03

### Added
- `lib/feature-flags.ts` for environment-driven toggling of Candidate Portal (`FEATURE_CANDIDATE_PORTAL`) and Public Jobs (`FEATURE_PUBLIC_JOBS`).
- `lib/auth-guard.ts` providing reusable RBAC guards (`requireAdminSession`, `requireStaffSession`, `requireRole`), S3/R2 object ownership verification (`isObjectKeyOwnedByUser`), and upload file metadata validation (`validateUploadMetadata`).
- `app/api/health/route.ts` database-backed healthcheck endpoint for Docker container monitoring.
- `.dockerignore` and `.github/workflows/ci.yml` for automated TypeScript and unit test verification.
- `lib/__tests__/security-foundation.test.ts` unit test suite covering feature flags, IDOR protection, and upload validation.

### Changed
- **Security Hardening:**
  - Protected `GET/POST /api/users` and `PUT/DELETE /api/users/[id]` with `requireAdminSession()`, password length enforcement ($\ge 8$ chars), self-lockout prevention, and singleton Prisma client (`R-01`).
  - Added `requireStaffSession()` guards across internal Server Actions in `app/actions/dashboard.ts`, `app/actions/document.ts`, `app/actions/master-data.ts`, and `app/actions/job.ts` (`R-02`).
  - Secured `GET /api/file` and `getUploadUrl`/`getPreviewUrl` against IDOR and cross-folder path traversal (`R-04`).
  - Enforced authentication, strict MIME type allowlisting (`PDF`, `JPG`, `PNG`), and 5 MB limit in `app/actions/upload.ts` (`R-03`).
  - Updated `middleware.ts` and `POST /api/auth/register` to enforce `FEATURE_CANDIDATE_PORTAL` and `FEATURE_PUBLIC_JOBS` flags (`R-07`).
- **Docker & Shared VM Port Alignment:**
  - Enabled `output: "standalone"` in `next.config.ts` (`R-11`).
  - Updated `Dockerfile` to `node:20-slim` with `openssl`, `curl`, Prisma runtime artifacts, `PORT=3020`, and `HEALTHCHECK` (`http://localhost:3020/api/health`).
  - Reconfigured `docker-compose.yml` to use non-conflicting port `3020` for `app` and `127.0.0.1:5435` for `db` (avoiding VM conflicts on ports `3000`, `3001`, `5432`, `5433`), removed public bucket ACL command, and placed local MinIO under optional `local-minio` profile.

## [Phase 1] — Planning & Architecture Baseline — 2026-11-03

### Added
- **Project Governance & Portfolio Documentation (`docs/`):**
  - `docs/PROJECT_LOG.md` for chronological engineering log and decision tracking.
  - `docs/PRD.md` covering business goals, MVP scope, KPI definitions, user stories, acceptance criteria, and prototype gap analysis.
  - `docs/ARCHITECTURE.md` with system context, container deployment diagrams, ERD, and security boundary specifications.
  - `docs/RISK_REGISTER.md` cataloging 15 technical, security, compliance (UU PDP No. 27/2022), and infrastructure risks with concrete mitigations.
  - `docs/ESTIMATION_AND_COST.md` detailing sprint backlog, effort estimation, and OPEX/CAPEX comparison (Existing Azure VM + Cloudflare R2 vs Azure Managed Services).
  - `docs/TESTING_AND_DEPLOYMENT.md` defining QA strategy, Docker Compose hardening, backup/restore procedures, rollback runbook, and Developer Knowledge Transfer (KT) questionnaire.
  - `docs/PORTFOLIO_SUMMARY.md` summarizing business impact and technical leadership metrics.
  - Architecture Decision Records (`docs/adr/ADR-001` through `ADR-006`).

## [0.1.0-prototype] — Up to 2026-11-02 (Existing Developer Commits `5aaeb87`..`2d95345`)

### Added (Prototype Baseline)
- Next.js 16.2 (App Router) + React 19 + Tailwind CSS v4 + Prisma 5.15 + PostgreSQL schema and initial migrations.
- Recruiter/Admin Dashboard: executive summary, reports, pipeline funnel, regional distribution & Leaflet GeoMap, interview calendar, priority jobs.
- Master Data modules: Province, City, Customer, Site Operation (with custom SLA), Clinic/MCU, Position, Department, Institute/BLK, Certification, Certification Schema, Request Type, Rejection Message, Pipeline Stage SLA.
- Job Openings CRUD with registration numbers, B1 form reference, BNSP/skill test flags, and timeline generation.
- 10-stage Recruitment Pipeline (CV Screening, Interview HR, Psikotes, Technical Test, Interview User, Offering, MCU, Training, Induction, PKWT) with stage verification, document generation (Offering Letter, MCU, BAST), talent pool, archived candidates, and blacklist management.
- Candidate Portal prototype (login, registration, profile & S3/R2 document upload, job application, application history, message feed).

