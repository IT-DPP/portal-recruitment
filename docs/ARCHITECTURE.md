# Dokumentasi Arsitektur — DPP Recruitment Portal Dashboard

Dokumen ini menjelaskan arsitektur aplikasi, topologi infrastruktur pada VM Azure non-Odoo, alur keamanan & penyimpanan objek Cloudflare R2, serta Entity-Relationship Diagram (ERD).

---

## 1. Konteks Sistem & Batasan Integrasi

> [!IMPORTANT]
> **Batasan Mutlak:** Sistem ini berdiri sendiri (*standalone*) dan merupakan *System of Record* untuk seluruh proses rekrutmen PT Dian Pandu Pratama (DPP). Sistem ini **TIDAK** terhubung ke VM maupun database Odoo dalam bentuk apa pun.

```mermaid
flowchart LR
    subgraph Users["Pengguna (Maks 30 User, <=20 Concurrent)"]
        Admin["Super Admin (IT)"]
        Recruiter["Tim Recruitment (Manager & Recruiter)"]
        Candidate["Kandidat Eksternal (Flagged: OFF di Prod Awal)"]
    end

    subgraph DNS_Edge["DNS & Edge"]
        cPanel["cPanel DNS (portal.dpp.co.id & portal-staging.dpp.co.id)"]
    end

    subgraph Azure_NonOdoo["Azure VM Non-Odoo (Shared Linux VM)"]
        Proxy["Reverse Proxy (Nginx / Caddy) + Let's Encrypt TLS"]
        subgraph Docker_Prod["Docker Project: dpp-portal-prod"]
            AppProd["Next.js 16 Fullstack Container (127.0.0.1:3010)"]
            DBProd[("PostgreSQL 15 Prod (Internal Network)")]
        end
        subgraph Docker_Staging["Docker Project: dpp-portal-staging"]
            AppStg["Next.js 16 Staging Container (127.0.0.1:3011)"]
            DBStg[("PostgreSQL 15 Staging (Internal Network)")]
        end
        OtherApps["Container Proyek Web/Mobile DPP Lainnya (Terisolasi)"]
    end

    subgraph Cloud_Storage["External Object Storage"]
        R2[("Cloudflare R2 (Private Bucket: Prod & Staging)")]
    end

    subgraph Forbidden["Zona Terlarang (DILARANG DISENTUH)"]
        OdooVM["Azure VM Odoo & DB Odoo"]
    end

    Admin & Recruiter & Candidate -->|HTTPS 443| cPanel
    cPanel --> Proxy
    Proxy -->|portal.dpp.co.id| AppProd
    Proxy -->|portal-staging.dpp.co.id| AppStg
    AppProd --> DBProd
    AppStg --> DBStg
    AppProd & AppStg -->|S3 API Presigned URL| R2
```

---

## 2. Arsitektur Lapisan Aplikasi (Next.js 16 App Router)

Aplikasi menggunakan pola **Modular Fullstack Monolith** di atas Next.js 16.2:

```mermaid
flowchart TD
    subgraph Client_Layer["Presentation Layer (React 19 Client & Server Components)"]
        DashboardUI["Dashboard UI (/dashboard/*)"]
        CandidateUI["Candidate & Public Jobs UI (/candidate/*, /jobs/*) [Feature Flagged]"]
        DocGenUI["Client Document Preview & Exporter (DOCX/PDF/XLSX)"]
    end

    subgraph Security_Boundary["Security & Middleware Layer"]
        MW["Middleware / Proxy Guard (JWT Session, RBAC, Feature Flag Gate)"]
        AuthGuard["Server Action & API Guard (requireAuth, Role Check, Rate Limit)"]
    end

    subgraph Application_Layer["Application & Domain Layer"]
        Actions["Server Actions (app/actions/*.ts)"]
        APIRoutes["Route Handlers (app/api/auth, app/api/users, app/api/file)"]
        Services["Domain Services (Audit Logger, Storage Guard, Excel Import/Export)"]
    end

    subgraph Data_Layer["Persistence & Storage Layer"]
        Prisma["Prisma Client Singleton (lib/prisma.ts)"]
        S3Client["S3/R2 Client (lib/s3.ts)"]
    end

    DashboardUI & CandidateUI --> MW
    MW --> Actions & APIRoutes
    Actions & APIRoutes --> AuthGuard
    AuthGuard --> Services
    Services --> Prisma & S3Client
```

### Struktur Direktori Eksisting (Dipertahankan Selama Knowledge Transfer)
- `app/dashboard/*`: Seluruh halaman operasional internal (Executive, Reports, GeoSource, Job Openings, Pipeline 10 tahap, Talent Pool, Interviews, Calendar, Blacklist, Archived, Generate Documents, Settings Master Data, SLA, Users).
- `app/candidate/*` & `app/jobs/*`: Portal kandidat & lowongan publik (dikontrol via *feature flag* `FEATURE_CANDIDATE_PORTAL` dan `FEATURE_PUBLIC_JOBS`).
- `app/actions/*`: Server Actions (`job.ts`, `candidate-profile.ts`, `candidate-application.ts`, `master-data.ts`, `dashboard.ts`, `document.ts`, `upload.ts`).
- `app/api/*`: Route handlers (`auth/[...nextauth]`, `auth/register`, `users`, `users/[id]`, `file`).
- `lib/*`: Konfigurasi `auth.ts`, `prisma.ts`, `s3.ts`, `document-generator.ts`, `mcu-clinics.ts`, `validations/*`.
- `prisma/`: `schema.prisma`, `migrations/`, `seed-essential.ts`, `seed-dummy.ts`.

---

## 3. Alur Keamanan Dokumen (Cloudflare R2 Presigned URL)

Untuk menjaga beban RAM/CPU VM tetap rendah sekaligus mematuhi UU PDP, file tidak melewati memori container Next.js secara terus-menerus, melainkan menggunakan *presigned URL* berumur pendek dengan pemeriksaan otorisasi ketat:

```mermaid
sequenceDiagram
    autonumber
    actor User as Recruiter / Candidate
    participant App as Next.js Server (Action / API)
    participant DB as PostgreSQL (Prisma)
    participant R2 as Cloudflare R2 (Private Bucket)

    Note over User,R2: Alur Upload Dokumen
    User->>App: Request Upload URL (fileName, mimeType, sizeBytes, docType)
    App->>App: Verifikasi Session, Role & Validasi Tipe (PDF/JPG/PNG) + Ukuran (<=5MB)
    App->>App: Bangun objectKey di Server (tidak percaya path dari client)
    App->>R2: Sign PutObjectCommand (expiresIn: 900s)
    R2-->>App: Presigned PUT URL
    App-->>User: Return { uploadUrl, objectKey }
    User->>R2: HTTP PUT file binary langsung ke R2
    User->>App: Konfirmasi metadata dokumen
    App->>DB: Simpan CandidateDocument & AuditLog

    Note over User,R2: Alur Download / Preview Dokumen (/api/file?key=...)
    User->>App: GET /api/file?key=candidates/xyz/cv.pdf
    App->>DB: Cek Session + Kepemilikan Dokumen / Role Internal
    alt Tidak Berhak (Unauthorized / IDOR)
        App-->>User: HTTP 403 Forbidden
    else Berhak
        App->>DB: Catat AuditLog (VIEW_DOCUMENT)
        App->>R2: Sign GetObjectCommand (expiresIn: 300s)
        App-->>User: HTTP 302 Redirect ke Presigned GET URL
    end
```

---

## 4. Model Data (ERD)

### 4.1 ERD Saat Ini (22 Model di `prisma/schema.prisma`)
Seluruh primary key saat ini menggunakan `@id @default(cuid())` yang sudah bersifat unik dan stabil.

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o| CandidateProfile : has

    MasterProvince ||--o{ MasterCity : contains
    MasterProvince ||--o{ MasterSite : locates
    MasterProvince ||--o{ MasterClinic : locates
    MasterCustomer ||--o{ MasterSite : owns
    MasterCity ||--o{ MasterSite : locates

    MasterSite ||--o{ SiteSla : customizes
    MasterPipelineStage ||--o{ SiteSla : defines
    MasterPipelineStage ||--o{ MasterRejectionMessage : has

    MasterCustomer ||--o{ JobOpening : requests
    MasterSite ||--o{ JobOpening : places
    MasterPosition ||--o{ JobOpening : roles
    MasterDepartment ||--o{ JobOpening : belongs

    JobOpening ||--o{ JobTimeline : schedules
    MasterPipelineStage ||--o{ JobTimeline : stages
    JobOpening ||--o{ Application : receives

    CandidateProfile ||--o{ CandidateDocument : uploads
    CandidateProfile ||--o{ Application : submits
    MasterPipelineStage ||--o{ Application : currentStage

    Application ||--o{ ApplicationHistory : logs
    Application ||--o{ Interview : schedules

    User {
        string id PK
        string name
        string email UK
        string password
        string department
        enum role "ADMIN | RECRUITER | CANDIDATE"
    }

    CandidateProfile {
        string id PK
        string userId FK
        string nik UK
        string kk
        string whatsapp
        boolean isTalentPool
        boolean isBlacklisted
        string blacklistReason
        boolean isArchived
    }

    JobOpening {
        string id PK
        string noRegistrasi UK
        string noFormB1
        string customerId FK
        string siteId FK
        int jumlahPermintaan
        datetime tanggalMasuk
        enum status "DRAFT | ACTIVE | CLOSED | OVERDUE"
        boolean isPriority
        boolean requiresBnsp
        boolean requiresSkillTest
    }

    Application {
        string id PK
        string jobId FK
        string candidateProfileId FK
        string currentStageId FK
        enum status "ACTIVE | REJECTED | HIRED | WITHDRAWN"
        json stageData
        string mcuPackage
    }
```

### 4.2 Penambahan Model Minimal untuk Target Produksi (Non-Breaking)
Untuk memenuhi kebutuhan Audit Log (§4.9 & §8 Brief) tanpa merusak skema developer saat ini, hanya diperlukan penambahan 1 tabel mandiri `AuditLog` (dan opsional kolom `mustChangePassword` pada `User`) pada Fase 2 pasca-KT:

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?
  actorEmail  String?
  actorRole   String?
  action      String   // e.g. USER_CREATED, PASSWORD_RESET, STAGE_MOVED, FILE_DOWNLOADED
  entityType  String   // e.g. User, JobOpening, Application, CandidateDocument
  entityId    String?
  metadata    Json?    // Ringkasan perubahan (tanpa data rahasia/password)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

---

## 5. Desain Konfigurasi Environment & Fleksibilitas Subdomain

Agar perubahan domain/subdomain di masa depan (`portal.dpp.co.id`, `portal-staging.dpp.co.id`, atau nama baru) tidak memerlukan perubahan kode, seluruh referensi URL dan fitur dikendalikan lewat variabel environment:

| Variabel Environment | Nilai Lokal (`.env`) | Nilai Staging | Nilai Production |
|---|---|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://portal-staging.dpp.co.id` | `https://portal.dpp.co.id` |
| `FEATURE_CANDIDATE_PORTAL` | `true` | `false` (tahap awal) | `false` (tahap awal) |
| `FEATURE_PUBLIC_JOBS` | `true` | `false` (tahap awal) | `false` (tahap awal) |
| `S3_ENDPOINT` | `http://localhost:9000` (atau R2 dev) | `https://<acct>.r2.cloudflarestorage.com` | `https://<acct>.r2.cloudflarestorage.com` |
| `S3_BUCKET_NAME` | `recruitment-bucket` | `dpp-recruitment-staging` | `dpp-recruitment-prod` |
| `S3_REGION` | `us-east-1` | `auto` | `auto` |

