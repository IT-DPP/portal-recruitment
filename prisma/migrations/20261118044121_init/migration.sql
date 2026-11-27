-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RECRUITER', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AssessmentStage" AS ENUM ('CV_SCREENING', 'HR_INTERVIEW', 'PSIKOTES', 'SKILL_TEST', 'USER_INTERVIEW', 'BNSP_VALIDATION');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'RECOMMENDED', 'CONSIDERED', 'NOT_RECOMMENDED');

-- CreateEnum
CREATE TYPE "McuFitnessStatus" AS ENUM ('PENDING', 'FIT', 'FIT_WITH_RESTRICTION', 'TEMPORARY_UNFIT', 'UNFIT');

-- CreateEnum
CREATE TYPE "OfferingLetterStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'REJECTED_FINAL');

-- CreateEnum
CREATE TYPE "MobilizationStatus" AS ENUM ('PENDING', 'TRAINING', 'INDUCTION', 'READY_TO_DEPLOY', 'IN_TRANSIT', 'ARRIVED_ON_SITE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "department" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CANDIDATE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "MasterProvince" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterProvince_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterCity" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,

    CONSTRAINT "MasterCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterCustomer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterSite" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "customerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "useSpecificSla" BOOLEAN NOT NULL DEFAULT false,
    "mcuPackage" TEXT,

    CONSTRAINT "MasterSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterClinic" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "MasterClinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPosition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterPipelineStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "slaDays" INTEGER NOT NULL DEFAULT 3,
    "reminderDays" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MasterPipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSla" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "slaDays" INTEGER NOT NULL,
    "reminderDays" INTEGER NOT NULL,

    CONSTRAINT "SiteSla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterRejectionMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "stageId" TEXT NOT NULL,

    CONSTRAINT "MasterRejectionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterInstitute" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "status" TEXT,
    "type" TEXT,

    CONSTRAINT "MasterInstitute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterDepartment" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterCertificationSchema" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterCertificationSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterRequestType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterRequestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterCertification" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MasterCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nik" TEXT,
    "nikHash" TEXT,
    "kk" TEXT,
    "birthPlace" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "religion" TEXT,
    "maritalStatus" TEXT,
    "whatsapp" TEXT,
    "emergencyContact" TEXT,
    "domicileAddress" TEXT,
    "currentAddress" TEXT,
    "educationType" TEXT,
    "latestEducation" TEXT,
    "educationInstitution" TEXT,
    "trainingCenterType" TEXT,
    "trainingCenterName" TEXT,
    "cityId" TEXT,
    "provinceId" TEXT,
    "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isTalentPool" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "blacklistedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateDocument" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpening" (
    "id" TEXT NOT NULL,
    "noRegistrasi" TEXT NOT NULL,
    "positionId" TEXT,
    "customerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "statusPermintaan" TEXT NOT NULL,
    "jumlahPermintaan" INTEGER NOT NULL,
    "headcountTarget" INTEGER NOT NULL DEFAULT 1,
    "headcountFulfilled" INTEGER NOT NULL DEFAULT 0,
    "headcountOnSite" INTEGER NOT NULL DEFAULT 0,
    "tanggalMasuk" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "requiresSkillTest" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "positionName" TEXT,
    "benefit" TEXT,
    "district" TEXT,
    "deskripsi" TEXT,
    "kualifikasi" TEXT,
    "noFormB1" TEXT,
    "requiresBnsp" BOOLEAN NOT NULL DEFAULT false,
    "publishedDate" TIMESTAMP(3),
    "slug" TEXT,

    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTimeline" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "startDate" TIMESTAMP(3) NOT NULL,
    "deadlineDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "currentStageId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stageData" JSONB DEFAULT '{}',
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stageId" TEXT,
    "stageName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "locationOrLink" TEXT,
    "interviewerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAssessment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "stageType" "AssessmentStage" NOT NULL,
    "interviewerId" TEXT,
    "interviewerName" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "conductedDate" TIMESTAMP(3),
    "result" "AssessmentResult" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "attachmentUrl" TEXT,
    "attachmentKey" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCheckUp" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "clinicId" TEXT,
    "clinicName" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "packageMcu" TEXT,
    "fitnessStatus" "McuFitnessStatus" NOT NULL DEFAULT 'PENDING',
    "doctorNotesEncrypted" TEXT,
    "candidateProofUrl" TEXT,
    "candidateProofKey" TEXT,
    "certificateUrl" TEXT,
    "certificateKey" TEXT,
    "recheckDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCheckUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingLetterRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "baseSalaryEncrypted" TEXT,
    "siteAllowanceEncrypted" TEXT,
    "issuedDate" TIMESTAMP(3),
    "status" "OfferingLetterStatus" NOT NULL DEFAULT 'DRAFT',
    "documentUrl" TEXT,
    "documentKey" TEXT,
    "signedDocumentUrl" TEXT,
    "signedDocumentKey" TEXT,
    "signedAt" TIMESTAMP(3),
    "candidateNote" TEXT,
    "recruiterResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferingLetterRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractMobilization" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "siteId" TEXT,
    "contractNumber" TEXT,
    "nrp" TEXT,
    "minePermitNumber" TEXT,
    "trainingStartDate" TIMESTAMP(3),
    "trainingEndDate" TIMESTAMP(3),
    "inductionDate" TIMESTAMP(3),
    "pkwtStartDate" TIMESTAMP(3),
    "pkwtEndDate" TIMESTAMP(3),
    "mobilizationStatus" "MobilizationStatus" NOT NULL DEFAULT 'PENDING',
    "bastStatus" TEXT,
    "bastValidationLink" TEXT,
    "contractDocumentUrl" TEXT,
    "contractDocumentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractMobilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "MasterProvince_code_key" ON "MasterProvince"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterCity_code_key" ON "MasterCity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterCustomer_code_key" ON "MasterCustomer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterSite_code_key" ON "MasterSite"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterClinic_code_key" ON "MasterClinic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterPosition_code_key" ON "MasterPosition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSla_siteId_stageId_key" ON "SiteSla"("siteId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterRejectionMessage_code_key" ON "MasterRejectionMessage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterInstitute_code_key" ON "MasterInstitute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterDepartment_code_key" ON "MasterDepartment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterCertificationSchema_code_key" ON "MasterCertificationSchema"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterRequestType_code_key" ON "MasterRequestType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MasterCertification_code_key" ON "MasterCertification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_nikHash_key" ON "CandidateProfile"("nikHash");

-- CreateIndex
CREATE INDEX "CandidateProfile_deletedAt_idx" ON "CandidateProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "CandidateProfile_isTalentPool_isBlacklisted_isArchived_idx" ON "CandidateProfile"("isTalentPool", "isBlacklisted", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "JobOpening_noRegistrasi_key" ON "JobOpening"("noRegistrasi");

-- CreateIndex
CREATE UNIQUE INDEX "JobOpening_slug_key" ON "JobOpening"("slug");

-- CreateIndex
CREATE INDEX "JobOpening_status_customerId_idx" ON "JobOpening"("status", "customerId");

-- CreateIndex
CREATE INDEX "JobOpening_status_tanggalMasuk_idx" ON "JobOpening"("status", "tanggalMasuk");

-- CreateIndex
CREATE INDEX "JobOpening_deletedAt_idx" ON "JobOpening"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobTimeline_jobId_stageId_key" ON "JobTimeline"("jobId", "stageId");

-- CreateIndex
CREATE INDEX "Application_jobId_status_idx" ON "Application"("jobId", "status");

-- CreateIndex
CREATE INDEX "Application_candidateProfileId_status_idx" ON "Application"("candidateProfileId", "status");

-- CreateIndex
CREATE INDEX "Application_currentStageId_idx" ON "Application"("currentStageId");

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE INDEX "ApplicationAssessment_applicationId_stageType_idx" ON "ApplicationAssessment"("applicationId", "stageType");

-- CreateIndex
CREATE INDEX "ApplicationAssessment_result_idx" ON "ApplicationAssessment"("result");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCheckUp_applicationId_key" ON "MedicalCheckUp"("applicationId");

-- CreateIndex
CREATE INDEX "MedicalCheckUp_clinicId_idx" ON "MedicalCheckUp"("clinicId");

-- CreateIndex
CREATE INDEX "MedicalCheckUp_fitnessStatus_idx" ON "MedicalCheckUp"("fitnessStatus");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingLetterRecord_applicationId_key" ON "OfferingLetterRecord"("applicationId");

-- CreateIndex
CREATE INDEX "OfferingLetterRecord_status_idx" ON "OfferingLetterRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractMobilization_applicationId_key" ON "ContractMobilization"("applicationId");

-- CreateIndex
CREATE INDEX "ContractMobilization_siteId_idx" ON "ContractMobilization"("siteId");

-- CreateIndex
CREATE INDEX "ContractMobilization_mobilizationStatus_idx" ON "ContractMobilization"("mobilizationStatus");

-- CreateIndex
CREATE INDEX "ContractMobilization_nrp_idx" ON "ContractMobilization"("nrp");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterCity" ADD CONSTRAINT "MasterCity_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterSite" ADD CONSTRAINT "MasterSite_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "MasterCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterSite" ADD CONSTRAINT "MasterSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "MasterCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterSite" ADD CONSTRAINT "MasterSite_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterClinic" ADD CONSTRAINT "MasterClinic_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSla" ADD CONSTRAINT "SiteSla_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "MasterSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSla" ADD CONSTRAINT "SiteSla_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "MasterPipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterRejectionMessage" ADD CONSTRAINT "MasterRejectionMessage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "MasterPipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "MasterCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateDocument" ADD CONSTRAINT "CandidateDocument_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "MasterCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "MasterCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "MasterDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "MasterPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "MasterSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTimeline" ADD CONSTRAINT "JobTimeline_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTimeline" ADD CONSTRAINT "JobTimeline_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "MasterPipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "MasterPipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobOpening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "MasterPipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAssessment" ADD CONSTRAINT "ApplicationAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCheckUp" ADD CONSTRAINT "MedicalCheckUp_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCheckUp" ADD CONSTRAINT "MedicalCheckUp_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "MasterClinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingLetterRecord" ADD CONSTRAINT "OfferingLetterRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractMobilization" ADD CONSTRAINT "ContractMobilization_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractMobilization" ADD CONSTRAINT "ContractMobilization_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "MasterSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
