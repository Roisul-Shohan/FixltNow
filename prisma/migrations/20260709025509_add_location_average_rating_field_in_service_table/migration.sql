/*
  Warnings:

  - Added the required column `serviceId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "serviceId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "location" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
