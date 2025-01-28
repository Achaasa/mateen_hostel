/*
  Warnings:

  - Added the required column `hostelId` to the `Amenities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Amenities" ADD COLUMN     "hostelId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Amenities" ADD CONSTRAINT "Amenities_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
