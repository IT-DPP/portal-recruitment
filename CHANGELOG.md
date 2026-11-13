# Changelog

All notable changes to the **DPP Recruitment Portal Dashboard** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Revamp Option B: Phase 2 (Database Normalization & UU PDP Compliance) — 2026-11-13

### Added
- `docs/adr/ADR-008-database-normalization-and-pdp-compliance.md`: Architecture Decision Record covering stage data relational normalization, UU PDP No. 27/2022 compliance, and field-level AES-256-GCM encryption.
- `lib/crypto.ts`: Field-Level Encryption utility using **AES-256-GCM** (96-bit random IV, 128-bit authentication tag, `enc:v1:` prefix) and **HMAC-SHA256 Blind Indexing** for fast database lookups without decrypting PII.
- `lib/__tests__/crypto.test.ts`: 7 unit tests verifying encryption round-trips, anti-tampering validation, legacy plaintext fallback, deterministic blind index hashing, and presentation NIK masking.
- `scripts/run-all-tests.ts`: Unified test runner executing all 13 security, domain, and cryptographic unit tests.
- `scripts/migrate-stagedata-to-relational.ts` (`npm run db:migrate:fase2`): Idempotent, non-destructive migration script that transforms historical untyped JSON `stageData` into normalized relational models, protects candidate PII, and initializes job quota metrics.
- `prisma/migrations/20261113140000_fase2_normalization_and_pdp/migration.sql`: Zero-downtime PostgreSQL migration creating formal relational tables, enums, soft delete columns, and composite indexes.
- **Relational Domain Models in `prisma/schema.prisma`:**
  - `ApplicationAssessment`: Structured scoring and records for CV Screening, HR Interview, Psikotes, Skill Test, User Interview, and BNSP Certification Validation.
  - `MedicalCheckUp`: Structured MCU scheduling, clinic tracking, fitness classification (`FIT`, `FIT_WITH_RESTRICTION`, `TEMPORARY_UNFIT`, `UNFIT`), candidate proof attachments, and AES-256-GCM encrypted health diagnoses (`doctorNotesEncrypted`).
  - `OfferingLetterRecord`: Formal offering letter status lifecycle (`DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `REJECTED_FINAL`), signed document keys, and encrypted compensation data.
  - `ContractMobilization`: Mining labor supply tracking with PKWT contract number, site NRP, Mine Permit/SIMPER number, induction dates, BAST status, and mobilization progression (`PENDING` $\rightarrow$ `ARRIVED_ON_SITE`).

### Changed
- **Candidate Profile & Privacy (UU PDP Compliance):**
  - Updated `CandidateProfile`: added `nikHash String? @unique` (Blind Index) and `deletedAt DateTime?` (Soft Delete).
  - Updated `app/actions/candidate-profile.ts` to transparently encrypt `nik` and `kk` on storage and decrypt on retrieval, preventing duplicate registration via `nikHash`.
- **Job Headcount Tracking (Labor Supply Alignment):**
  - Updated `JobOpening`: added `headcountTarget`, `headcountFulfilled`, and `headcountOnSite` to track real client quota fulfillment.
  - Updated `updateApplicationStage` in `app/actions/job.ts` to automatically recalculate fulfilled and on-site headcounts whenever candidates advance stages.
- **Server Actions Relational Sync:**
  - Added `syncStageDataToRelational` in `app/actions/job.ts` to automatically sync all `stageData` updates into the new relational tables while retaining the legacy JSON for complete backward compatibility.
  - Updated `app/actions/candidate-application.ts` to sync candidate responses (Offering acceptance/decline and MCU proofs) directly into `OfferingLetterRecord` and `MedicalCheckUp`.
  - Updated `applyToJob` in `app/actions/job.ts` to enforce the single active application policy using indexed `nikHash` lookups.
- **Database Query Optimization:**
  - Added composite indexes: `JobOpening(status, customerId)`, `JobOpening(status, tanggalMasuk)`, `Application(jobId, status)`, `Application(candidateProfileId, status)`, and `CandidateProfile(isTalentPool, isBlacklisted, isArchived)`.

## [Phase 1 Hardening] — Revamp Option B: Phase 1 (Security & Dependency Hardening) — 2026-11-13

### Added
- `docs/adr/ADR-007-security-and-dependency-hardening.md`: Architecture Decision Record for server action auth guards, middleware API protection, and dependency elimination.
- Global API authentication and RBAC gate in `middleware.ts` covering `/api/*` with whitelisted public paths (`/api/auth/*` and `/api/health`).

### Changed
- **Server Actions RBAC Hardening:**
  - Enforced `requireStaffSession()` on previously unauthenticated pagination/filter server actions in `app/actions/job.ts`: `getPaginatedTalentPool`, `getPaginatedArchivedCandidates`, `getPaginatedBlacklistedCandidates`, `getPaginatedInterviewsDashboardData`, `getPaginatedJobOpenings`, and `getFilteredPipelineData` (mitigating critical candidate PII data leak).
  - Enforced `requireStaffSession()` on certification schema mutations in `app/actions/master-data.ts`: `createCertificationSchema`, `updateCertificationSchema`, `deleteCertificationSchema`, and `ensureExtendedPipelineStages`.
- **PII & Data Hygiene:**
  - Sanitized `lib/mcu-clinics.ts`: removed hardcoded staff names, personal mobile numbers, and corporate emails, replacing them with configurable generic fallbacks (`process.env.NEXT_PUBLIC_MCU_*`).
  - Purged `MOCK_MCU_CANDIDATES` merge logic from `app/dashboard/generate-documents/GenerateDocumentsClient.tsx` to prevent fake candidate data injection into real production documents.
- **Dependency Cleanup & Vulnerability Mitigation:**
  - Uninstalled vulnerable and unused dependencies: `xlsx` (Prototype Pollution & ReDoS vulnerability), `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, and `html-to-docx`.
  - Removed unused `xlsx` import in `lib/document-generator.ts`.

## [Phase 3] — (MVP Polish, Audit Log, Login Rate-Limiting & R2 Storage Consolidation) — 2026-11-03

### Added
- `AuditLog` model in `prisma/schema.prisma` and migration `20261103043000_add_audit_log`.
- `lib/audit-log.ts` service with automatic sensitive-field redaction (`sanitizeAuditMetadata`) and fail-safe logging (`recordAuditLog`).
- `app/api/audit-logs/route.ts` and `/dashboard/settings/audit-logs` Admin UI with search, action filtering, and CSV export (`§4.9` & `§8` Brief).
- `lib/rate-limit.ts` in-memory brute-force protection integrated into NextAuth `CredentialsProvider` (`5` failed attempts / `15` minutes lockout).
- `app/api/file/upload/route.ts` same-origin upload endpoint supporting Cloudflare R2 (`portal-recruitment` bucket) and local disk fallback without browser CORS issues.
- `lib/dummy-file-generator.ts` on-the-fly PDF 1.4 and SVG avatar generator for seeded candidate records.
- `prisma/ensure-db.ts` and `prisma/load-env.ts` for automated local database provisioning and seed script environment loading.
- `deploy/nginx/recruitment.dpp.co.id.conf` Nginx reverse proxy configuration and `docs/VM_AND_CPANEL_SETUP.md` deployment runbook for `https://recruitment.dpp.co.id`.

### Changed
- `lib/s3.ts`, `app/api/file/route.ts`, and `app/actions/upload.ts`: routed uploads and inline file previews directly through Cloudflare R2 (`getObjectFromS3`, `uploadBufferToS3`) with local and dummy fallback.
- `Dockerfile`, `entrypoint.sh`, and `docker-compose.yml`: removed legacy MinIO containers and hardcoded fallback credentials, bundled full `@prisma` runtime scope, and precompiled Prisma seed scripts (`seed-essential.js` & `seed-dummy.js`) into the runner image.
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

