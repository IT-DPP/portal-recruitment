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

-- AlterTable CandidateProfile: Drop old plaintext unique index on nik and introduce nikHash & soft delete
DROP INDEX IF EXISTS "CandidateProfile_nik_key";
ALTER TABLE "CandidateProfile" ADD COLUMN "nikHash" TEXT;
ALTER TABLE "CandidateProfile" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_nikHash_key" ON "CandidateProfile"("nikHash");
CREATE INDEX "CandidateProfile_deletedAt_idx" ON "CandidateProfile"("deletedAt");
CREATE INDEX "CandidateProfile_isTalentPool_isBlacklisted_isArchived_idx" ON "CandidateProfile"("isTalentPool", "isBlacklisted", "isArchived");

-- AlterTable JobOpening: Add headcount tracking and composite indexes
ALTER TABLE "JobOpening" ADD COLUMN "headcountTarget" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "JobOpening" ADD COLUMN "headcountFulfilled" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobOpening" ADD COLUMN "headcountOnSite" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobOpening" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "JobOpening_status_customerId_idx" ON "JobOpening"("status", "customerId");
CREATE INDEX "JobOpening_status_tanggalMasuk_idx" ON "JobOpening"("status", "tanggalMasuk");
CREATE INDEX "JobOpening_deletedAt_idx" ON "JobOpening"("deletedAt");

-- AlterTable Application: Add soft delete and composite query indexes
ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Application_jobId_status_idx" ON "Application"("jobId", "status");
CREATE INDEX "Application_candidateProfileId_status_idx" ON "Application"("candidateProfileId", "status");
CREATE INDEX "Application_currentStageId_idx" ON "Application"("currentStageId");
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateTable ApplicationAssessment
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

-- CreateIndex
CREATE INDEX "ApplicationAssessment_applicationId_stageType_idx" ON "ApplicationAssessment"("applicationId", "stageType");
CREATE INDEX "ApplicationAssessment_result_idx" ON "ApplicationAssessment"("result");

-- CreateTable MedicalCheckUp
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

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCheckUp_applicationId_key" ON "MedicalCheckUp"("applicationId");
CREATE INDEX "MedicalCheckUp_clinicId_idx" ON "MedicalCheckUp"("clinicId");
CREATE INDEX "MedicalCheckUp_fitnessStatus_idx" ON "MedicalCheckUp"("fitnessStatus");

-- CreateTable OfferingLetterRecord
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

-- CreateIndex
CREATE UNIQUE INDEX "OfferingLetterRecord_applicationId_key" ON "OfferingLetterRecord"("applicationId");
CREATE INDEX "OfferingLetterRecord_status_idx" ON "OfferingLetterRecord"("status");

-- CreateTable ContractMobilization
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

-- CreateIndex
CREATE UNIQUE INDEX "ContractMobilization_applicationId_key" ON "ContractMobilization"("applicationId");
CREATE INDEX "ContractMobilization_siteId_idx" ON "ContractMobilization"("siteId");
CREATE INDEX "ContractMobilization_mobilizationStatus_idx" ON "ContractMobilization"("mobilizationStatus");
CREATE INDEX "ContractMobilization_nrp_idx" ON "ContractMobilization"("nrp");

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

