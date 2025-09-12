-- AlterTable
ALTER TABLE "UserWorkspace" ADD COLUMN "removedAt" DATETIME;
ALTER TABLE "UserWorkspace" ADD COLUMN "removedById" TEXT;

-- CreateIndex
CREATE INDEX "UserWorkspace_removedAt_idx" ON "UserWorkspace"("removedAt");
