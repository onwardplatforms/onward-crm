-- Create Workspace table first
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create unique index for slug
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- Create a default workspace for existing data
INSERT INTO "Workspace" ("id", "name", "slug", "updatedAt") 
VALUES ('default-workspace-id', 'Default Workspace', 'default', CURRENT_TIMESTAMP);

-- Create UserWorkspace table
CREATE TABLE "UserWorkspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for UserWorkspace
CREATE INDEX "UserWorkspace_userId_idx" ON "UserWorkspace"("userId");
CREATE INDEX "UserWorkspace_workspaceId_idx" ON "UserWorkspace"("workspaceId");
CREATE UNIQUE INDEX "UserWorkspace_userId_workspaceId_key" ON "UserWorkspace"("userId", "workspaceId");

-- Add all existing users to the default workspace as owners
INSERT INTO "UserWorkspace" ("id", "userId", "workspaceId", "role")
SELECT 
    'uw-' || "id",
    "id",
    'default-workspace-id',
    'owner'
FROM "User";

-- AlterTable Session to add currentWorkspaceId
ALTER TABLE "Session" ADD COLUMN "currentWorkspaceId" TEXT;

-- Update all existing sessions to use the default workspace
UPDATE "Session" SET "currentWorkspaceId" = 'default-workspace-id';

-- RedefineTables with default workspace
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Update Activity table
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "dealId" TEXT,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "Activity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("id", "type", "subject", "description", "date", "createdAt", "updatedAt", "workspaceId", "dealId", "userId", "assignedToId") 
SELECT "id", "type", "subject", "description", "date", "createdAt", "updatedAt", 'default-workspace-id', "dealId", "userId", "assignedToId" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE INDEX "Activity_workspaceId_idx" ON "Activity"("workspaceId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX "Activity_date_idx" ON "Activity"("date");
CREATE INDEX "Activity_assignedToId_idx" ON "Activity"("assignedToId");

-- Update Company table
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "Company_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Company_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("id", "name", "website", "industry", "size", "location", "notes", "createdAt", "updatedAt", "workspaceId", "userId", "assignedToId") 
SELECT "id", "name", "website", "industry", "size", "location", "notes", "createdAt", "updatedAt", 'default-workspace-id', "userId", "assignedToId" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE INDEX "Company_workspaceId_idx" ON "Company"("workspaceId");
CREATE INDEX "Company_userId_idx" ON "Company"("userId");
CREATE INDEX "Company_assignedToId_idx" ON "Company"("assignedToId");

-- Update Contact table
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("id", "firstName", "lastName", "email", "phone", "title", "notes", "createdAt", "updatedAt", "workspaceId", "companyId", "userId", "assignedToId") 
SELECT "id", "firstName", "lastName", "email", "phone", "title", "notes", "createdAt", "updatedAt", 'default-workspace-id', "companyId", "userId", "assignedToId" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_workspaceId_idx" ON "Contact"("workspaceId");
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
CREATE INDEX "Contact_assignedToId_idx" ON "Contact"("assignedToId");

-- Update Deal table
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
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "Deal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("id", "name", "value", "licenses", "stage", "position", "closeDate", "probability", "notes", "createdAt", "updatedAt", "workspaceId", "companyId", "contactId", "userId", "assignedToId") 
SELECT "id", "name", "value", "licenses", "stage", "position", "closeDate", "probability", "notes", "createdAt", "updatedAt", 'default-workspace-id', "companyId", "contactId", "userId", "assignedToId" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE INDEX "Deal_workspaceId_idx" ON "Deal"("workspaceId");
CREATE INDEX "Deal_userId_idx" ON "Deal"("userId");
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");
CREATE INDEX "Deal_assignedToId_idx" ON "Deal"("assignedToId");

-- Update Notification table
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT,
    "dealId" TEXT,
    CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("id", "type", "title", "message", "read", "createdAt", "workspaceId", "userId", "activityId", "dealId") 
SELECT "id", "type", "title", "message", "read", "createdAt", 'default-workspace-id', "userId", "activityId", "dealId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_workspaceId_idx" ON "Notification"("workspaceId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;