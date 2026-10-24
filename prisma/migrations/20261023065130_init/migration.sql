-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RECRUITER', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('ACTIVE', 'REJECTED', 'HIRED', 'WITHDRAWN');

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
    "tanggalMasuk" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "requiresSkillTest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "positionName" TEXT,
    "benefit" TEXT,
    "district" TEXT,
    "kualifikasi" TEXT,
    "noFormB1" TEXT,
    "requiresBnsp" BOOLEAN NOT NULL DEFAULT false,
    "publishedDate" TIMESTAMP(3),

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
CREATE UNIQUE INDEX "CandidateProfile_nik_key" ON "CandidateProfile"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "JobOpening_noRegistrasi_key" ON "JobOpening"("noRegistrasi");

-- CreateIndex
CREATE UNIQUE INDEX "JobTimeline_jobId_stageId_key" ON "JobTimeline"("jobId", "stageId");

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
