-- CreateTable
CREATE TABLE "MasterClinic" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "MasterClinic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterClinic_code_key" ON "MasterClinic"("code");

-- AddForeignKey
ALTER TABLE "MasterClinic" ADD CONSTRAINT "MasterClinic_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "MasterProvince"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
