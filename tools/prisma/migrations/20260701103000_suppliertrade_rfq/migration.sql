-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainKey" TEXT NOT NULL,
    "buyerOrgId" TEXT,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "deliveryState" TEXT,
    "deliveryDistrict" TEXT,
    "targetDate" DATETIME,
    "budgetMinPaise" INTEGER,
    "budgetMaxPaise" INTEGER,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "metadataJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RfqLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "commodityKey" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "targetGrade" TEXT,
    "attributesJson" JSONB,
    CONSTRAINT "RfqLine_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RfqResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "listingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "quotedPricePaise" INTEGER,
    "availableQuantity" REAL,
    "unit" TEXT,
    "deliveryDate" DATETIME,
    "notes" TEXT,
    "matchScore" REAL,
    "matchReasonsJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RfqResponse_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerValidationSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT,
    "buyerOrgId" TEXT,
    "signal" TEXT NOT NULL,
    "amountPaise" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuyerValidationSignal_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Rfq_domainKey_status_idx" ON "Rfq"("domainKey", "status");

-- CreateIndex
CREATE INDEX "Rfq_buyerOrgId_idx" ON "Rfq"("buyerOrgId");

-- CreateIndex
CREATE INDEX "Rfq_createdAt_idx" ON "Rfq"("createdAt");

-- CreateIndex
CREATE INDEX "RfqLine_rfqId_idx" ON "RfqLine"("rfqId");

-- CreateIndex
CREATE INDEX "RfqLine_commodityKey_idx" ON "RfqLine"("commodityKey");

-- CreateIndex
CREATE UNIQUE INDEX "RfqResponse_rfqId_supplierId_listingId_key" ON "RfqResponse"("rfqId", "supplierId", "listingId");

-- CreateIndex
CREATE INDEX "RfqResponse_rfqId_status_idx" ON "RfqResponse"("rfqId", "status");

-- CreateIndex
CREATE INDEX "RfqResponse_supplierId_idx" ON "RfqResponse"("supplierId");

-- CreateIndex
CREATE INDEX "RfqResponse_listingId_idx" ON "RfqResponse"("listingId");

-- CreateIndex
CREATE INDEX "BuyerValidationSignal_rfqId_idx" ON "BuyerValidationSignal"("rfqId");

-- CreateIndex
CREATE INDEX "BuyerValidationSignal_buyerOrgId_idx" ON "BuyerValidationSignal"("buyerOrgId");

-- CreateIndex
CREATE INDEX "BuyerValidationSignal_signal_idx" ON "BuyerValidationSignal"("signal");
