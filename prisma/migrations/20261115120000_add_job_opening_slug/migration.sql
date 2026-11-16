-- AlterTable
ALTER TABLE "JobOpening" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobOpening_slug_key" ON "JobOpening"("slug");
