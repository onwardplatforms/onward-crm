-- CreateTable
CREATE TABLE "_ActivityParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ActivityParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ActivityParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityParticipants_AB_unique" ON "_ActivityParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityParticipants_B_index" ON "_ActivityParticipants"("B");
