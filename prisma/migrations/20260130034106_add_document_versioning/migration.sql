-- CreateEnum
CREATE TYPE "VersionChangeType" AS ENUM ('MANUAL', 'AUTO', 'ROLLBACK', 'PUBLISH', 'IMPORT');

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "changeType" "VersionChangeType" NOT NULL DEFAULT 'MANUAL',
    "changeSummary" TEXT,
    "size" INTEGER NOT NULL,
    "name" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "contentTypeId" TEXT NOT NULL,
    "maxVersions" INTEGER,
    "maxAgeDays" INTEGER,
    "keepPublished" BOOLEAN NOT NULL DEFAULT true,
    "keepNamed" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_versions_contentId_createdAt_idx" ON "document_versions"("contentId", "createdAt");

-- CreateIndex
CREATE INDEX "document_versions_contentId_changeType_idx" ON "document_versions"("contentId", "changeType");

-- CreateIndex
CREATE INDEX "document_versions_createdById_idx" ON "document_versions"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_contentId_versionNumber_key" ON "document_versions"("contentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_contentTypeId_key" ON "retention_policies"("contentTypeId");

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "content_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
