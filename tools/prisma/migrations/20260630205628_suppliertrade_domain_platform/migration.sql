-- CreateTable
CREATE TABLE "Domain" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "configJson" JSONB NOT NULL,
    "metaSchemaVersion" TEXT NOT NULL DEFAULT '1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DomainVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "configJson" JSONB NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DomainVersion_domainKey_fkey" FOREIGN KEY ("domainKey") REFERENCES "Domain" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "supplierType" TEXT NOT NULL,
    "orgId" TEXT,
    "gstin" TEXT,
    "legalName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "attributes" JSONB NOT NULL,
    "consentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "attributes" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "contextJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "signalsJson" JSONB NOT NULL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationReport_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QcJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "scorer" TEXT NOT NULL,
    "criteriaResultsJson" JSONB NOT NULL,
    "grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QcJob_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "fileRef" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBySignal" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileRef" TEXT NOT NULL,
    "geoLat" REAL,
    "geoLng" REAL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Domain_status_idx" ON "Domain"("status");

-- CreateIndex
CREATE INDEX "DomainVersion_domainKey_idx" ON "DomainVersion"("domainKey");

-- CreateIndex
CREATE UNIQUE INDEX "DomainVersion_domainKey_version_key" ON "DomainVersion"("domainKey", "version");

-- CreateIndex
CREATE INDEX "Supplier_domainKey_supplierType_idx" ON "Supplier"("domainKey", "supplierType");

-- CreateIndex
CREATE INDEX "Supplier_domainKey_status_idx" ON "Supplier"("domainKey", "status");

-- CreateIndex
CREATE INDEX "Supplier_orgId_idx" ON "Supplier"("orgId");

-- CreateIndex
CREATE INDEX "Listing_domainKey_status_idx" ON "Listing"("domainKey", "status");

-- CreateIndex
CREATE INDEX "Listing_supplierId_idx" ON "Listing"("supplierId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_domainKey_currentState_idx" ON "WorkflowInstance"("domainKey", "currentState");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowInstance_subjectType_subjectId_key" ON "WorkflowInstance"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_instanceId_idx" ON "WorkflowEvent"("instanceId");

-- CreateIndex
CREATE INDEX "VerificationReport_domainKey_supplierId_idx" ON "VerificationReport"("domainKey", "supplierId");

-- CreateIndex
CREATE INDEX "VerificationReport_supplierId_createdAt_idx" ON "VerificationReport"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "QcJob_domainKey_status_idx" ON "QcJob"("domainKey", "status");

-- CreateIndex
CREATE INDEX "QcJob_listingId_idx" ON "QcJob"("listingId");

-- CreateIndex
CREATE INDEX "SupplierDocument_supplierId_docKey_idx" ON "SupplierDocument"("supplierId", "docKey");

-- CreateIndex
CREATE INDEX "MediaAsset_supplierId_mediaKey_idx" ON "MediaAsset"("supplierId", "mediaKey");
