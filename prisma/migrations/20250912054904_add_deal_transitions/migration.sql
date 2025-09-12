-- CreateTable
CREATE TABLE "DealTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "fromPosition" INTEGER,
    "toPosition" INTEGER NOT NULL,
    "value" REAL,
    "probability" INTEGER,
    "changedById" TEXT,
    "transitionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    CONSTRAINT "DealTransition_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DealTransition_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DealTransition_dealId_idx" ON "DealTransition"("dealId");

-- CreateIndex
CREATE INDEX "DealTransition_changedById_idx" ON "DealTransition"("changedById");

-- CreateIndex
CREATE INDEX "DealTransition_transitionAt_idx" ON "DealTransition"("transitionAt");

-- CreateIndex
CREATE INDEX "DealTransition_fromStage_idx" ON "DealTransition"("fromStage");

-- CreateIndex
CREATE INDEX "DealTransition_toStage_idx" ON "DealTransition"("toStage");
