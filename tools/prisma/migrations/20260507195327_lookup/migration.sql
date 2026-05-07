-- CreateTable
CREATE TABLE "LookupGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookupGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LookupValue" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookupValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LookupGroup_key_key" ON "LookupGroup"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LookupValue_groupId_value_key" ON "LookupValue"("groupId", "value");

-- AddForeignKey
ALTER TABLE "LookupValue" ADD CONSTRAINT "LookupValue_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LookupGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
