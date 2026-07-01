-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "fileRef" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "originalName" TEXT,
    "sizeBytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBySignal" TEXT,
    "uploadedById" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "decidedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupplierDocument" ("docKey", "domainKey", "fileRef", "id", "mime", "status", "supplierId", "uploadedAt", "verifiedBySignal") SELECT "docKey", "domainKey", "fileRef", "id", "mime", "status", "supplierId", "uploadedAt", "verifiedBySignal" FROM "SupplierDocument";
DROP TABLE "SupplierDocument";
ALTER TABLE "new_SupplierDocument" RENAME TO "SupplierDocument";
CREATE INDEX "SupplierDocument_supplierId_docKey_idx" ON "SupplierDocument"("supplierId", "docKey");
CREATE INDEX "SupplierDocument_supplierId_status_idx" ON "SupplierDocument"("supplierId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
