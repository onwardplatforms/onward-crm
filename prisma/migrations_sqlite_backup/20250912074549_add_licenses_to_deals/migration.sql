-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" REAL,
    "licenses" INTEGER NOT NULL DEFAULT 1,
    "stage" TEXT NOT NULL DEFAULT 'lead',
    "position" INTEGER NOT NULL DEFAULT 0,
    "closeDate" DATETIME,
    "probability" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("assignedToId", "closeDate", "companyId", "contactId", "createdAt", "id", "name", "notes", "position", "probability", "stage", "updatedAt", "userId", "value") SELECT "assignedToId", "closeDate", "companyId", "contactId", "createdAt", "id", "name", "notes", "position", "probability", "stage", "updatedAt", "userId", "value" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE INDEX "Deal_userId_idx" ON "Deal"("userId");
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");
CREATE INDEX "Deal_assignedToId_idx" ON "Deal"("assignedToId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
