-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "contactId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
